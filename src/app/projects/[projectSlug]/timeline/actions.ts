"use server";

import { revalidatePath } from "next/cache";
import { MilestoneCategory, MilestoneStatus } from "@prisma/client";
import { db } from "@/server/db";
import { getUserOrRedirect } from "@/server/auth";
import { canEditProject } from "@/server/permissions";
import type { MilestoneFormState } from "./formState";
import { pushMilestoneToAsana } from "./asana-sync";

function parseDate(value: string | undefined | null) {
  if (!value) return null;
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

function getTimelinePath(slug?: string | null) {
  return slug ? `/projects/${slug}/timeline` : "/projects";
}

export async function upsertMilestone(prevState: MilestoneFormState, formData: FormData): Promise<MilestoneFormState> {
  const { person } = await getUserOrRedirect();

  if (!canEditProject(person?.role)) {
    return { errors: {}, formError: "You do not have permission to edit this project." };
  }

  const milestoneId = formData.get("milestoneId")?.toString();
  const projectId = formData.get("projectId")?.toString();
  const slug = formData.get("slug")?.toString();
  const title = formData.get("title")?.toString().trim();
  const description = formData.get("description")?.toString().trim() || null;
  const dateValue = parseDate(formData.get("date")?.toString());
  const asanaTaskGid = formData.get("asanaTaskGid")?.toString().trim() || null;
  const leadDepartmentId = formData.get("leadDepartmentId")?.toString().trim() || null;
  const relatedObjectiveId = formData.get("relatedObjectiveId")?.toString().trim() || null;
  const pushId = formData.get("pushId")?.toString().trim() || null;
  const isMajor = formData.get("isMajor") === "on";
  const category = (formData.get("category")?.toString() as MilestoneCategory | undefined) ?? MilestoneCategory.OTHER;
  const status = (formData.get("status")?.toString() as MilestoneStatus | undefined) ?? MilestoneStatus.PLANNED;
  const shouldPushToAsana = formData.get("asanaPush") === "on";

  const errors: MilestoneFormState["errors"] = {};

  if (!projectId) {
    return { errors, formError: "Project is required" };
  }

  if (!title) {
    errors.title = "Title is required";
  }

  if (!dateValue) {
    errors.date = "Date is required";
  }

  if (!Object.values(MilestoneCategory).includes(category)) {
    return { errors, formError: "Select a valid category" };
  }

  if (!Object.values(MilestoneStatus).includes(status)) {
    return { errors, formError: "Select a valid status" };
  }

  if (errors.title || errors.date) {
    return { errors };
  }

  const project = await db.project.findUnique({ where: { id: projectId }, select: { id: true } });
  if (!project) {
    return { errors, formError: "Project not found" };
  }

  if (leadDepartmentId) {
    const dept = await db.department.findUnique({ where: { id: leadDepartmentId }, select: { id: true } });
    if (!dept) return { errors, formError: "Department not found" };
  }

  if (relatedObjectiveId) {
    const objective = await db.objective.findUnique({ where: { id: relatedObjectiveId }, select: { id: true, projectId: true } });
    if (!objective || objective.projectId !== projectId) {
      return { errors, formError: "Objective not found for this project" };
    }
  }

  if (pushId) {
    const push = await db.push.findUnique({ where: { id: pushId }, select: { id: true, projectId: true } });
    if (!push || push.projectId !== projectId) {
      return { errors, formError: "Push not found for this project" };
    }
  }

  const data = {
    projectId,
    title: title!,
    description,
    date: dateValue!,
    isMajor,
    category,
    status,
    leadDepartmentId,
    relatedObjectiveId,
    pushId,
    asanaTaskGid
  };

  let finalMilestoneId = milestoneId;
  if (milestoneId) {
    await db.milestone.update({ where: { id: milestoneId }, data });
  } else {
    const created = await db.milestone.create({ data });
    finalMilestoneId = created.id;
  }

  if (shouldPushToAsana && finalMilestoneId) {
    try {
      await pushMilestoneToAsana(finalMilestoneId);
    } catch (error) {
      console.error("Asana push failed:", error);
      // We don't fail the whole action, but maybe we should return a warning?
      // For now, we'll just log it.
    }
  }

  revalidatePath(getTimelinePath(slug));
  revalidatePath(`/projects/${slug}/overview`);
  return { errors: {}, success: true };
}

export async function deleteMilestone(input: { milestoneId: string; projectId: string; slug?: string | null }) {
  const { person } = await getUserOrRedirect();

  if (!canEditProject(person?.role)) {
    return;
  }

  const milestone = await db.milestone.findUnique({
    where: { id: input.milestoneId },
    include: { activities: true, commsItems: true, pressureAssets: true }
  });

  if (!milestone || milestone.projectId !== input.projectId) {
    return;
  }

  if (milestone.activities.length || milestone.commsItems.length || milestone.pressureAssets.length) {
    return;
  }

  await db.milestone.delete({ where: { id: milestone.id } });
  revalidatePath(getTimelinePath(input.slug));
  revalidatePath(`/projects/${input.slug}/overview`);
}

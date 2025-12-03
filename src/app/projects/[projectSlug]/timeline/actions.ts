"use server";

import { revalidatePath } from "next/cache";
import { MilestoneCategory, MilestoneStatus } from "@prisma/client";
import { db } from "@/server/db";
import { getUserOrRedirect } from "@/server/auth";
import { canEditProject } from "@/server/permissions";

function parseDate(value: string | undefined | null) {
  if (!value) return null;
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

function getTimelinePath(slug?: string | null) {
  return slug ? `/projects/${slug}/timeline` : "/projects";
}

export type MilestoneFormState = {
  errors: {
    title?: string;
    date?: string;
    category?: string;
    status?: string;
  };
  formError?: string;
  success?: boolean;
};

export function getMilestoneInitialState(): MilestoneFormState {
  return { errors: {}, success: false };
}

export async function upsertMilestone(prevState: MilestoneFormState, formData: FormData) {
  const { person } = await getUserOrRedirect();

  if (!canEditProject(person?.role)) {
    return { errors: {}, formError: "You do not have permission to edit this project." };
  }

  const milestoneId = formData.get("milestoneId")?.toString() || null;
  const projectId = formData.get("projectId")?.toString();
  const slug = formData.get("slug")?.toString();
  const title = formData.get("title")?.toString().trim();
  const description = formData.get("description")?.toString().trim() || null;
  const date = parseDate(formData.get("date")?.toString());
  const isMajor = formData.get("isMajor") === "on";
  const category = (formData.get("category")?.toString() as MilestoneCategory | undefined) ?? MilestoneCategory.OTHER;
  const status = (formData.get("status")?.toString() as MilestoneStatus | undefined) ?? MilestoneStatus.PLANNED;
  const leadDepartmentId = formData.get("leadDepartmentId")?.toString() || null;
  const relatedObjectiveId = formData.get("relatedObjectiveId")?.toString() || null;
  const pushId = formData.get("pushId")?.toString() || null;
  const asanaTaskGid = formData.get("asanaTaskGid")?.toString().trim() || null;

  const errors: MilestoneFormState["errors"] = {};

  if (!projectId) {
    return { errors, formError: "Project is required" };
  }

  if (!title) {
    errors.title = "Title is required";
  }

  if (!date) {
    errors.date = "Valid date is required";
  }

  if (!Object.values(MilestoneCategory).includes(category)) {
    errors.category = "Select a valid category";
  }

  if (!Object.values(MilestoneStatus).includes(status)) {
    errors.status = "Select a valid status";
  }

  if (errors.title || errors.date || errors.category || errors.status) {
    return { errors };
  }

  const project = await db.project.findUnique({ where: { id: projectId }, select: { id: true } });
  if (!project) {
    return { errors, formError: "Project not found" };
  }

  if (leadDepartmentId) {
    const department = await db.department.findUnique({ where: { id: leadDepartmentId }, select: { id: true } });
    if (!department) {
      return { errors, formError: "Lead department not found" };
    }
  }

  if (relatedObjectiveId) {
    const objective = await db.objective.findUnique({ where: { id: relatedObjectiveId }, select: { projectId: true } });
    if (!objective || objective.projectId !== projectId) {
      return { errors, formError: "Objective not found for this project" };
    }
  }

  if (pushId) {
    const push = await db.push.findUnique({ where: { id: pushId }, select: { projectId: true } });
    if (!push || push.projectId !== projectId) {
      return { errors, formError: "Push not found for this project" };
    }
  }

  const data = {
    projectId,
    title: title!,
    description,
    date: date!,
    isMajor,
    category,
    status,
    leadDepartmentId,
    relatedObjectiveId,
    pushId,
    asanaTaskGid
  };

  if (milestoneId) {
    await db.milestone.update({ where: { id: milestoneId }, data });
  } else {
    await db.milestone.create({ data });
  }

  revalidatePath(getTimelinePath(slug));
  revalidatePath(`/projects/${slug}/overview`);
  return { errors: {}, success: true };
}

export type MilestoneDeleteState = {
  formError?: string;
  success?: boolean;
};

export function getMilestoneDeleteInitialState(): MilestoneDeleteState {
  return { success: false };
}

export async function deleteMilestone(prevState: MilestoneDeleteState, formData: FormData) {
  const { person } = await getUserOrRedirect();

  if (!canEditProject(person?.role)) {
    return { formError: "You do not have permission to delete milestones." };
  }

  const milestoneId = formData.get("milestoneId")?.toString();
  const slug = formData.get("slug")?.toString();

  if (!milestoneId) {
    return { formError: "Milestone is required" };
  }

  const milestone = await db.milestone.findUnique({
    where: { id: milestoneId },
    select: { projectId: true, _count: { select: { activities: true, commsItems: true, pressureAssets: true } } }
  });

  if (!milestone) {
    return { formError: "Milestone not found" };
  }

  if (milestone._count.activities || milestone._count.commsItems || milestone._count.pressureAssets) {
    return {
      formError: "This milestone is linked to activities, comms items, or pressure assets. Remove those links first."
    };
  }

  await db.milestone.delete({ where: { id: milestoneId } });

  revalidatePath(getTimelinePath(slug));
  revalidatePath(`/projects/${slug}/overview`);
  return { success: true };
}

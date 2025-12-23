"use server";

import { revalidatePath } from "next/cache";
import { ActivityStatus } from "@prisma/client";
import { db } from "@/server/db";
import { getUserOrRedirect } from "@/server/auth";
import { canEditProject } from "@/server/permissions";
import { formatPushName } from "@/server/pushes";
import type { ActivityFormState, PushFormState } from "./formState";

function parseDate(value: string | undefined | null) {
  if (!value) return null;
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

function getPushesPath(slug?: string | null) {
  return slug ? `/projects/${slug}/pushes` : "/projects";
}

export async function upsertPush(prevState: PushFormState, formData: FormData) {
  const { person } = await getUserOrRedirect();

  if (!canEditProject(person?.role)) {
    return { errors: {}, formError: "You do not have permission to edit this project." };
  }

  const pushId = formData.get("pushId")?.toString();
  const projectId = formData.get("projectId")?.toString();
  const slug = formData.get("slug")?.toString();
  const objectiveId = formData.get("objectiveId")?.toString() || null;
  const highLevelSummary = formData.get("highLevelSummary")?.toString().trim() || null;
  const sequenceValue = formData.get("sequenceIndex")?.toString();
  const startDate = parseDate(formData.get("startDate")?.toString());
  const endDate = parseDate(formData.get("endDate")?.toString());
  const asanaProjectGid = formData.get("asanaProjectGid")?.toString().trim() || null;

  const errors: PushFormState["errors"] = {};

  if (!projectId) {
    return { errors, formError: "Project is required" };
  }

  if (!startDate) {
    errors.startDate = "Start date is required";
  }

  if (!endDate) {
    errors.endDate = "End date is required";
  }

  if (startDate && endDate && endDate < startDate) {
    errors.endDate = "End date cannot be before start date";
  }

  const parsedSequence = sequenceValue ? parseInt(sequenceValue, 10) : null;
  if (sequenceValue && (!parsedSequence || parsedSequence <= 0)) {
    errors.sequenceIndex = "Sequence index must be a positive number";
  }

  if (errors.startDate || errors.endDate || errors.sequenceIndex) {
    return { errors };
  }

  const project = await db.project.findUnique({ where: { id: projectId }, select: { id: true } });
  if (!project) {
    return { errors, formError: "Project not found" };
  }

  const defaultSequenceResult = await db.push.aggregate({
    where: { projectId },
    _max: { sequenceIndex: true }
  });
  const nextSequenceIndex = (defaultSequenceResult._max.sequenceIndex ?? 0) + 1;
  const sequenceIndex = parsedSequence ?? nextSequenceIndex;

  const existingWithSequence = await db.push.findFirst({
    where: {
      projectId,
      sequenceIndex,
      NOT: pushId ? { id: pushId } : undefined
    },
    select: { id: true }
  });

  if (existingWithSequence) {
    return { errors: { sequenceIndex: "Sequence index already used for another push" } };
  }

  if (objectiveId) {
    const objective = await db.objective.findUnique({ where: { id: objectiveId }, select: { projectId: true } });
    if (!objective || objective.projectId !== projectId) {
      return { errors, formError: "Objective not found for this project" };
    }
  }

  const data = {
    projectId,
    sequenceIndex,
    startDate: startDate!,
    endDate: endDate!,
    highLevelSummary,
    objectiveId,
    asanaProjectGid,
    name: formatPushName({ sequenceIndex, startDate: startDate!, endDate: endDate! })
  };

  if (pushId) {
    await db.push.update({ where: { id: pushId }, data });
  } else {
    await db.push.create({ data });
  }

  revalidatePath(getPushesPath(slug));
  revalidatePath(`/projects/${slug}/overview`);
  return { errors: {}, success: true };
}

function extractAsanaGid(input: string | null | undefined): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Handle URL format: https://app.asana.com/0/1208642902759881/1208642944747248/f
  // or simply the GID
  if (trimmed.startsWith("http")) {
    const parts = trimmed.split("/");
    // Usually the GID is the last or second to last part
    // Filtering for numeric parts
    const numericParts = parts.filter(p => p && /^\d+$/.test(p));
    return numericParts[numericParts.length - 1] || null;
  }

  return trimmed;
}

export async function upsertActivity(prevState: ActivityFormState, formData: FormData) {
  const { person } = await getUserOrRedirect();

  if (!canEditProject(person?.role)) {
    return { errors: {}, formError: "You do not have permission to edit this project." };
  }

  const activityId = formData.get("activityId")?.toString();
  const projectId = formData.get("projectId")?.toString();
  const pushId = formData.get("pushId")?.toString();
  const slug = formData.get("slug")?.toString();
  const title = formData.get("title")?.toString().trim();
  const description = formData.get("description")?.toString().trim() || null;
  const ownerId = formData.get("ownerId")?.toString().trim() || null;
  const departmentId = formData.get("departmentId")?.toString().trim() || null;
  const relatedKrId = formData.get("relatedKrId")?.toString().trim() || null;
  const relatedMilestoneId = formData.get("relatedMilestoneId")?.toString().trim() || null;
  const asanaTaskGid = extractAsanaGid(formData.get("asanaTaskGid")?.toString());
  const startDate = parseDate(formData.get("startDate")?.toString());
  const dueDate = parseDate(formData.get("dueDate")?.toString());
  const status = (formData.get("status")?.toString() as ActivityStatus | undefined) ?? ActivityStatus.NOT_STARTED;

  const errors: ActivityFormState["errors"] = {};

  if (!projectId || !pushId) {
    return { errors, formError: "Project and push are required" };
  }

  if (!title) {
    errors.title = "Title is required";
  }

  if (!Object.values(ActivityStatus).includes(status)) {
    errors.status = "Select a valid status";
  }

  if (errors.title || errors.status) {
    return { errors };
  }

  const push = await db.push.findUnique({ where: { id: pushId }, select: { id: true, projectId: true } });
  if (!push || push.projectId !== projectId) {
    return { errors, formError: "Push not found for this project" };
  }

  if (ownerId) {
    const owner = await db.person.findUnique({ where: { id: ownerId }, select: { id: true } });
    if (!owner) {
      return { errors, formError: "Owner not found" };
    }
  }

  if (departmentId) {
    const department = await db.department.findUnique({ where: { id: departmentId }, select: { id: true } });
    if (!department) {
      return { errors, formError: "Department not found" };
    }
  }

  if (relatedKrId) {
    const kr = await db.keyResult.findUnique({ where: { id: relatedKrId }, select: { projectId: true } });
    if (!kr || kr.projectId !== projectId) {
      return { errors, formError: "Key result not found for this project" };
    }
  }

  if (relatedMilestoneId) {
    const milestone = await db.milestone.findUnique({ where: { id: relatedMilestoneId }, select: { projectId: true } });
    if (!milestone || milestone.projectId !== projectId) {
      return { errors, formError: "Milestone not found for this project" };
    }
  }

  const data = {
    projectId,
    pushId,
    title: title!,
    description,
    ownerId,
    departmentId,
    relatedKrId,
    relatedMilestoneId,
    asanaTaskGid,
    startDate,
    dueDate,
    status
  };

  if (activityId) {
    await db.activity.update({ where: { id: activityId }, data });
  } else {
    await db.activity.create({ data });
  }

  revalidatePath(getPushesPath(slug));
  return { errors: {}, success: true };
}

export async function updateActivityStatus(formData: FormData) {
  const { person } = await getUserOrRedirect();

  if (!canEditProject(person?.role)) {
    return { success: false, error: "You do not have permission to edit this project." };
  }

  const activityId = formData.get("activityId")?.toString();
  const slug = formData.get("slug")?.toString();
  const status = formData.get("status")?.toString() as ActivityStatus | undefined;

  if (!activityId || !status || !Object.values(ActivityStatus).includes(status)) {
    return { success: false, error: "Invalid request" };
  }

  await db.activity.update({ where: { id: activityId }, data: { status } });
  revalidatePath(getPushesPath(slug));
  return { success: true };
}

export async function updateActivityOwner(formData: FormData) {
  const { person } = await getUserOrRedirect();

  if (!canEditProject(person?.role)) {
    return { success: false, error: "You do not have permission to edit this project." };
  }

  const activityId = formData.get("activityId")?.toString();
  const slug = formData.get("slug")?.toString();
  const ownerId = formData.get("ownerId")?.toString() || null;

  if (!activityId) {
    return { success: false, error: "Invalid request" };
  }

  if (ownerId) {
    const owner = await db.person.findUnique({ where: { id: ownerId }, select: { id: true } });
    if (!owner) {
      return { success: false, error: "Owner not found" };
    }
  }

  await db.activity.update({ where: { id: activityId }, data: { ownerId: ownerId || null } });
  revalidatePath(getPushesPath(slug));
  return { success: true };
}

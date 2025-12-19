"use server";

import { revalidatePath } from "next/cache";
import { ObjectiveStatus, KeyResultStatus } from "@prisma/client";
import { db } from "@/server/db";
import { getUserOrRedirect } from "@/server/auth";
import { canEditProject } from "@/server/permissions";
import { getNextKeyResultStatus } from "@/lib/key-result-status";
import type { CycleStatusState, KeyResultFormState, ObjectiveFormState } from "./formState";

function parseDate(value: string | undefined | null) {
  if (!value) return null;
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

function getOverviewPath(slug?: string | null) {
  return slug ? `/projects/${slug}/overview` : "/projects";
}

export async function upsertObjective(prevState: ObjectiveFormState, formData: FormData) {
  const { person } = await getUserOrRedirect();

  if (!canEditProject(person?.role)) {
    return { errors: {}, formError: "You do not have permission to edit this project." };
  }

  const objectiveId = formData.get("objectiveId")?.toString();
  const projectId = formData.get("projectId")?.toString();
  const slug = formData.get("slug")?.toString();
  const title = formData.get("title")?.toString().trim();
  const description = formData.get("description")?.toString().trim() || null;
  const timeframeStart = parseDate(formData.get("timeframeStart")?.toString());
  const timeframeEnd = parseDate(formData.get("timeframeEnd")?.toString());
  const status = formData.get("status")?.toString() as ObjectiveStatus | undefined;

  const errors: ObjectiveFormState["errors"] = {};

  if (!projectId) {
    return { errors, formError: "Project is required" };
  }

  if (!title) {
    errors.title = "Title is required";
  }

  if (timeframeStart && timeframeEnd && timeframeEnd < timeframeStart) {
    errors.timeframe = "End date cannot be before start date";
  }

  const validStatuses = Object.values(ObjectiveStatus);
  if (status && !validStatuses.includes(status)) {
    errors.status = "Select a valid status";
  }

  if (errors.title || errors.timeframe || errors.status) {
    return { errors };
  }

  const project = await db.project.findUnique({ where: { id: projectId } });
  if (!project) {
    return { errors, formError: "Project not found" };
  }

  const data = {
    projectId,
    title: title!,
    description,
    timeframeStart,
    timeframeEnd,
    status: status ?? ObjectiveStatus.ON_TRACK,
    isCurrent: true
  };

  if (objectiveId) {
    await db.$transaction([
      db.objective.updateMany({ where: { projectId }, data: { isCurrent: false } }),
      db.objective.update({ where: { id: objectiveId }, data })
    ]);
  } else {
    await db.$transaction([
      db.objective.updateMany({ where: { projectId }, data: { isCurrent: false } }),
      db.objective.create({ data })
    ]);
  }

  revalidatePath(getOverviewPath(slug));
  return { errors: {}, success: true };
}

export async function upsertKeyResult(prevState: KeyResultFormState, formData: FormData) {
  const { person } = await getUserOrRedirect();

  if (!canEditProject(person?.role)) {
    return { errors: {}, formError: "You do not have permission to edit this project." };
  }

  const keyResultId = formData.get("keyResultId")?.toString();
  const projectId = formData.get("projectId")?.toString();
  const objectiveId = formData.get("objectiveId")?.toString();
  const slug = formData.get("slug")?.toString();
  const code = formData.get("code")?.toString().trim().toUpperCase();
  const title = formData.get("title")?.toString().trim();
  const description = formData.get("description")?.toString().trim() || null;
  const targetValue = formData.get("targetValue")?.toString().trim() || null;
  const unit = formData.get("unit")?.toString().trim() || null;
  const currentValue = formData.get("currentValue")?.toString().trim() || null;
  const status = formData.get("status")?.toString() as KeyResultStatus | undefined;
  const ownerId = formData.get("ownerId")?.toString().trim() || null;
  const departmentId = formData.get("departmentId")?.toString().trim() || null;
  const dueDate = parseDate(formData.get("dueDate")?.toString());

  const errors: KeyResultFormState["errors"] = {};

  if (!projectId || !objectiveId) {
    return { errors, formError: "Objective is required before adding key results" };
  }

  if (!code) {
    errors.code = "Code is required";
  } else if (!/^KR[1-5]$/.test(code)) {
    errors.code = "Code must be KR1–KR5";
  }

  if (!title) {
    errors.title = "Title is required";
  }

  if (dueDate === null && formData.get("dueDate")) {
    errors.dueDate = "Enter a valid due date";
  }

  const validStatuses = Object.values(KeyResultStatus);
  const nextStatus = status ?? KeyResultStatus.GREEN;
  if (nextStatus && !validStatuses.includes(nextStatus)) {
    return { errors, formError: "Select a valid status" };
  }

  if (errors.code || errors.title || errors.dueDate) {
    return { errors };
  }

  const objective = await db.objective.findUnique({ where: { id: objectiveId } });
  if (!objective || objective.projectId !== projectId) {
    return { errors, formError: "Objective not found" };
  }

  if (!keyResultId) {
    const count = await db.keyResult.count({ where: { projectId, objectiveId } });
    if (count >= 5) {
      return { errors, formError: "You can only track up to 5 key results." };
    }
  } else {
    const existing = await db.keyResult.findUnique({ where: { id: keyResultId }, select: { projectId: true } });
    if (!existing || existing.projectId !== projectId) {
      return { errors, formError: "Key result not found" };
    }
  }

  const data = {
    projectId,
    objectiveId,
    code: code!,
    title: title!,
    description,
    targetValue,
    unit,
    currentValue,
    status: nextStatus,
    ownerId: ownerId || null,
    departmentId: departmentId || null,
    dueDate
  };

  if (keyResultId) {
    await db.keyResult.update({ where: { id: keyResultId }, data });
  } else {
    await db.keyResult.create({ data });
  }

  revalidatePath(getOverviewPath(slug));
  return { errors: {}, success: true };
}

export async function cycleKeyResultStatus(prevState: CycleStatusState, formData: FormData) {
  const { person } = await getUserOrRedirect();

  if (!canEditProject(person?.role)) {
    return { formError: "You do not have permission to edit this project." };
  }

  const keyResultId = formData.get("keyResultId")?.toString();
  const slug = formData.get("slug")?.toString();

  if (!keyResultId) {
    return { formError: "Key result not found" };
  }

  const keyResult = await db.keyResult.findUnique({ where: { id: keyResultId } });
  if (!keyResult) {
    return { formError: "Key result not found" };
  }

  const nextStatus = getNextKeyResultStatus(keyResult.status);
  await db.keyResult.update({ where: { id: keyResultId }, data: { status: nextStatus } });

  revalidatePath(getOverviewPath(slug));
  return { nextStatus };
}

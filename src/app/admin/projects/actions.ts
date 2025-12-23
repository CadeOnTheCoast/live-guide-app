"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { db } from "@/server/db";
import type { ProjectFormState, ProjectStatus } from "./formState";
import { PROJECT_STATUS_OPTIONS } from "./formState";

function parseDate(value: string | undefined | null) {
  if (!value) return null;
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

export async function upsertProject(prevState: ProjectFormState, formData: FormData) {
  const id = formData.get("id")?.toString();
  const name = formData.get("name")?.toString().trim();
  const slug = formData.get("slug")?.toString().trim();
  const description = formData.get("description")?.toString().trim() || null;
  const caseForChangeSummary = formData.get("caseForChangeSummary")?.toString().trim() || null;
  const caseForChangePageUrl = formData.get("caseForChangePageUrl")?.toString().trim() || null;
  const status = formData.get("status")?.toString() as ProjectStatus | undefined;
  const startDate = parseDate(formData.get("startDate")?.toString());
  const endDate = parseDate(formData.get("endDate")?.toString());
  const primaryOwnerId = formData.get("primaryOwnerId")?.toString().trim() || null;
  const asanaWorkspaceGid = formData.get("asanaWorkspaceGid")?.toString().trim() || null;
  const asanaProjectGid = formData.get("asanaProjectGid")?.toString().trim() || null;
  const asanaTeamGid = formData.get("asanaTeamGid")?.toString().trim() || null;
  const historyDebrief = formData.get("historyDebrief")?.toString().trim() || null;

  const errors: ProjectFormState["errors"] = {};

  if (!name) {
    errors.name = "Name is required";
  }

  if (!slug) {
    errors.slug = "Slug is required";
  }

  if (endDate && startDate && endDate < startDate) {
    errors.date = "End date cannot be before start date";
  }

  if (status && !PROJECT_STATUS_OPTIONS.includes(status)) {
    return { errors, formError: "Select a valid status" };
  }

  if (errors.name || errors.slug || errors.date) {
    return { errors };
  }

  const data = {
    name: name!,
    slug: slug!,
    description,
    caseForChangeSummary,
    caseForChangePageUrl,
    status: status ?? (PROJECT_STATUS_OPTIONS.find((value) => value === "ACTIVE") ?? PROJECT_STATUS_OPTIONS[0]),
    startDate,
    endDate,
    primaryOwnerId: primaryOwnerId || null,
    asanaWorkspaceGid,
    asanaProjectGid,
    asanaTeamGid,
    historyDebrief
  };

  try {
    if (id) {
      await db.project.update({ where: { id }, data });
    } else {
      await db.project.create({ data });
    }
  } catch (error: unknown) {
    if (error instanceof PrismaClientKnownRequestError && error.code === "P2002") {
      return { errors: { slug: "Slug must be unique" } };
    }
    throw error;
  }

  revalidatePath("/admin/projects");
  revalidatePath("/projects");
  redirect("/admin/projects");
}

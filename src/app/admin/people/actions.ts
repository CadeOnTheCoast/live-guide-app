"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { db } from "@/server/db";
import type { PersonActiveState, PersonFormState } from "./formState";

const USER_ROLES = ["ADMIN", "EDITOR", "VIEWER"] as const;
type UserRole = (typeof USER_ROLES)[number];

function isValidEmail(email: string) {
  return /.+@.+\..+/.test(email);
}

export async function upsertPerson(prevState: PersonFormState, formData: FormData) {
  const id = formData.get("id")?.toString();
  const name = formData.get("name")?.toString().trim();
  const email = formData.get("email")?.toString().trim();
  const role = formData.get("role")?.toString().trim().toUpperCase();
  const defaultDepartmentId = formData.get("defaultDepartmentId")?.toString().trim() || null;
  const isActive = formData.get("isActive") === "on";

  const errors: PersonFormState["errors"] = {};

  if (!name) {
    errors.name = "Name is required";
  }

  if (!email) {
    errors.email = "Email is required";
  } else if (!isValidEmail(email)) {
    errors.email = "Enter a valid email address";
  }

  if (!role || !USER_ROLES.includes(role as UserRole)) {
    errors.role = "Select a valid role";
  }

  if (errors.name || errors.email || errors.role) {
    return { errors };
  }

  const data = {
    name: name!,
    email: email!,
    role: role as UserRole,
    isActive,
    defaultDepartmentId: defaultDepartmentId || null
  };

  try {
    if (id) {
      await db.person.update({ where: { id }, data });
    } else {
      await db.person.create({ data });
    }
  } catch (error: unknown) {
    if (error instanceof PrismaClientKnownRequestError && error.code === "P2002") {
      return { errors: { email: "Email must be unique" } };
    }
    throw error;
  }

  revalidatePath("/admin/people");
  revalidatePath("/admin/projects");
  redirect("/admin/people");
}

export async function setPersonActive(prevState: PersonActiveState, formData: FormData) {
  const id = formData.get("id")?.toString();
  const activeValue = formData.get("isActive")?.toString();

  if (!id || typeof activeValue === "undefined") {
    return { formError: "Invalid request" };
  }

  const isActive = activeValue === "true";
  try {
    await db.person.update({ where: { id }, data: { isActive } });
  } catch (error: unknown) {
    if (error instanceof PrismaClientKnownRequestError && error.code === "P2025") {
      return { formError: "Person not found" };
    }
    throw error;
  }

  revalidatePath("/admin/people");
  revalidatePath("/projects");
  return {};
}

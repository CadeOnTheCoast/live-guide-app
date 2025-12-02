"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { db } from "@/server/db";

export type DepartmentFormState = {
  errors: {
    name?: string;
    code?: string;
  };
  formError?: string;
};

export function getDepartmentInitialState(): DepartmentFormState {
  return { errors: {} };
}

export async function upsertDepartment(prevState: DepartmentFormState, formData: FormData) {
  const id = formData.get("id")?.toString();
  const name = formData.get("name")?.toString().trim();
  const code = formData.get("code")?.toString().trim();

  const errors: DepartmentFormState["errors"] = {};

  if (!name) {
    errors.name = "Name is required";
  }

  if (!code) {
    errors.code = "Code is required";
  }

  if (errors.name || errors.code) {
    return { errors };
  }

  try {
    const data = { name: name!, code: code! };

    if (id) {
      await db.department.update({ where: { id }, data });
    } else {
      await db.department.create({ data });
    }
  } catch (error: unknown) {
    if (error instanceof PrismaClientKnownRequestError && error.code === "P2002") {
      return { errors: { code: "Code must be unique" } };
    }
    throw error;
  }

  revalidatePath("/admin/departments");
  revalidatePath("/projects");
  redirect("/admin/departments");
}

export type DeleteDepartmentState = {
  formError?: string;
};

export function getDeleteDepartmentInitialState(): DeleteDepartmentState {
  return {};
}

export async function deleteDepartment(prevState: DeleteDepartmentState, formData: FormData) {
  const id = formData.get("id")?.toString();

  if (!id) {
    return { formError: "Department not found" };
  }

  const department = await db.department.findUnique({
    where: { id },
    select: {
      _count: {
        select: {
          people: { where: { isActive: true } },
          activities: true,
          keyResults: true,
          milestones: true,
          staffAllocations: true
        }
      }
    }
  });

  if (!department) {
    return { formError: "Department not found" };
  }

  const references =
    department._count.people > 0 ||
    department._count.activities > 0 ||
    department._count.keyResults > 0 ||
    department._count.milestones > 0 ||
    department._count.staffAllocations > 0;

  if (references) {
    return { formError: "Cannot delete a department that is referenced by people or activities." };
  }

  await db.department.delete({ where: { id } });
  revalidatePath("/admin/departments");
  revalidatePath("/projects");
  redirect("/admin/departments");
}

"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { db } from "@/server/db";
import { getUserOrRedirect } from "@/server/auth";
import { logAudit } from "@/server/audit";
import type { DeleteDepartmentState, DepartmentFormState } from "./formState";

export async function upsertDepartment(prevState: DepartmentFormState, formData: FormData) {
  const id = formData.get("id")?.toString();
  const name = formData.get("name")?.toString().trim();
  const code = formData.get("code")?.toString().trim();
  const isActive = formData.get("isActive") === "on";
  const sortOrder = parseInt(formData.get("sortOrder")?.toString() || "0", 10);

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
    const { user } = await getUserOrRedirect();
    const actorEmail = user.email!;
    const actorUserId = user.id;
    const data = {
      name: name!,
      code: code!,
      isActive,
      sortOrder
    };

    if (id) {
      const before = await db.department.findUnique({ where: { id } });

      // Protect canonical code on update if desired
      // If updating, we ignore the code from the form to keep it immutable
      const updateData = { name: data.name, isActive: data.isActive, sortOrder: data.sortOrder };
      const after = await db.department.update({ where: { id }, data: updateData });

      try {
        await logAudit({
          actorEmail,
          actorUserId,
          action: "UPDATE",
          entityType: "Department",
          entityId: id,
          before,
          after,
        });
      } catch (e) {
        console.error("Audit log failed for department update:", e);
      }
    } else {
      const after = await db.department.create({ data });

      try {
        await logAudit({
          actorEmail,
          actorUserId,
          action: "CREATE",
          entityType: "Department",
          entityId: after.id,
          after,
        });
      } catch (e) {
        console.error("Audit log failed for department create:", e);
      }
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

  const { user } = await getUserOrRedirect();
  const actorEmail = user.email!;
  const actorUserId = user.id;

  const before = await db.department.findUnique({ where: { id } });
  await db.department.delete({ where: { id } });

  try {
    await logAudit({
      actorEmail,
      actorUserId,
      action: "DELETE",
      entityType: "Department",
      entityId: id,
      before,
    });
  } catch (e) {
    console.error("Audit log failed for department delete:", e);
  }
  revalidatePath("/admin/departments");
  revalidatePath("/projects");
  redirect("/admin/departments");
}

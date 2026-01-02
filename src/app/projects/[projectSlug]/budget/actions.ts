"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/server/db";
import { getUserOrRedirect } from "@/server/auth";
import { canEditProject } from "@/server/permissions";
import { Prisma } from "@prisma/client";

export async function updateBudgetLine(params: {
    id: string;
    amount?: number;
    unitCost?: number;
    quantity?: number;
    notes?: string;
    slug: string;
}) {
    const { person } = await getUserOrRedirect();

    if (!canEditProject(person?.role)) {
        throw new Error("Unauthorized");
    }

    const data: Prisma.BudgetLineUpdateInput = {};
    if (params.amount !== undefined) data.amount = new Prisma.Decimal(params.amount);
    if (params.unitCost !== undefined) data.unitCost = new Prisma.Decimal(params.unitCost);
    if (params.quantity !== undefined) data.quantity = params.quantity;
    if (params.notes !== undefined) data.notes = params.notes;

    await db.budgetLine.update({
        where: { id: params.id },
        data,
    });

    revalidatePath(`/projects/${params.slug}/budget`);
}

export async function addBudgetComment(params: {
    budgetLineId: string;
    text: string;
    slug: string;
}) {
    const { person } = await getUserOrRedirect();
    if (!person) throw new Error("Unauthorized");

    await db.budgetComment.create({
        data: {
            budgetLineId: params.budgetLineId,
            authorId: person.id,
            text: params.text,
        },
    });

    // Future phase: Integration with Teams/Email goes here
    console.log(`Notification trigger: Comment added to budget line ${params.budgetLineId} by ${person.name}`);

    revalidatePath(`/projects/${params.slug}/budget`);
}

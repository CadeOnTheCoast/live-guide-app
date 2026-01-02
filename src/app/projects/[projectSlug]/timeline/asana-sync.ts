"use server";

import { db } from "@/server/db";
import { fetchAsanaTask, updateAsanaTask } from "@/lib/asana";
import { revalidatePath } from "next/cache";

export async function syncMilestoneWithAsana(milestoneId: string) {
    const milestone = await db.milestone.findUnique({
        where: { id: milestoneId },
        include: { project: { select: { slug: true } } },
    });

    if (!milestone || !milestone.asanaTaskGid) {
        throw new Error("Milestone not found or has no Asana GID");
    }

    const asanaTask = await fetchAsanaTask(milestone.asanaTaskGid);

    // Asana is the source of truth for Title, Date, and Description
    const updatedData: {
        title: string;
        date?: Date;
        description?: string;
    } = {
        title: asanaTask.name,
    };

    if (asanaTask.due_on) {
        updatedData.date = new Date(asanaTask.due_on);
    }

    if (asanaTask.notes) {
        updatedData.description = asanaTask.notes;
    }

    await db.milestone.update({
        where: { id: milestoneId },
        data: updatedData,
    });

    revalidatePath(`/projects/${milestone.project.slug}/timeline`);
    revalidatePath(`/projects/${milestone.project.slug}/overview`);
}

export async function pushMilestoneToAsana(milestoneId: string) {
    const milestone = await db.milestone.findUnique({
        where: { id: milestoneId },
    });

    if (!milestone || !milestone.asanaTaskGid) {
        return; // Silent return if no GID
    }

    await updateAsanaTask(milestone.asanaTaskGid, {
        name: milestone.title,
        due_on: milestone.date.toISOString().split("T")[0],
        notes: milestone.description ?? "",
    });
}

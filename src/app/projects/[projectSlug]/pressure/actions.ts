"use server";

import { db } from "@/server/db";
import { revalidatePath } from "next/cache";
import { PressureCorner, PowerRating, StakeholderType } from "@prisma/client";
import { z } from "zod";

const decisionMakerSchema = z.object({
    id: z.string().optional(),
    projectId: z.string(),
    name: z.string().min(1, "Name is required"),
    title: z.string().optional(),
    organization: z.string().optional(),
    jurisdiction: z.string().optional(),
    priorityLevel: z.string().optional(),
    stance: z.string().optional(),
    notes: z.string().optional(),
    reason: z.string().optional(),
    pressurePoints: z.string().optional(),
    influencers: z.string().optional(),
    everyActionUrl: z.string().optional(),
});

export async function upsertDecisionMaker(formData: FormData) {
    const data = decisionMakerSchema.parse({
        id: formData.get("id") as string || undefined,
        projectId: formData.get("projectId") as string,
        name: formData.get("name") as string,
        title: formData.get("title") as string || undefined,
        organization: formData.get("organization") as string || undefined,
        jurisdiction: formData.get("jurisdiction") as string || undefined,
        priorityLevel: formData.get("priorityLevel") as string || undefined,
        stance: formData.get("stance") as string || undefined,
        notes: formData.get("notes") as string || undefined,
        reason: formData.get("reason") as string || undefined,
        pressurePoints: formData.get("pressurePoints") as string || undefined,
        influencers: formData.get("influencers") as string || undefined,
        everyActionUrl: formData.get("everyActionUrl") as string || undefined,
    });

    if (data.id) {
        await db.decisionMaker.update({
            where: { id: data.id },
            data: {
                name: data.name,
                title: data.title,
                organization: data.organization,
                jurisdiction: data.jurisdiction,
                priorityLevel: data.priorityLevel,
                stance: data.stance,
                notes: data.notes,
                reason: data.reason,
                pressurePoints: data.pressurePoints,
                influencers: data.influencers,
                everyActionUrl: data.everyActionUrl,
            },
        });
    } else {
        await db.decisionMaker.create({
            data: {
                projectId: data.projectId,
                name: data.name,
                title: data.title,
                organization: data.organization,
                jurisdiction: data.jurisdiction,
                priorityLevel: data.priorityLevel,
                stance: data.stance,
                notes: data.notes,
                reason: data.reason,
                pressurePoints: data.pressurePoints,
                influencers: data.influencers,
                everyActionUrl: data.everyActionUrl,
            },
        });
    }

    const project = await db.project.findUnique({ where: { id: data.projectId }, select: { slug: true } });
    if (project) {
        revalidatePath(`/projects/${project.slug}/pressure`);
    }
}

const pressureAssetSchema = z.object({
    id: z.string().optional(),
    projectId: z.string(),
    decisionMakerId: z.string(),
    corner: z.nativeEnum(PressureCorner),
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    status: z.string().optional(),
    powerRating: z.nativeEnum(PowerRating),
    weight: z.coerce.number().default(1.0),
});

export async function upsertPressureAsset(formData: FormData) {
    const data = pressureAssetSchema.parse({
        id: formData.get("id") as string || undefined,
        projectId: formData.get("projectId") as string,
        decisionMakerId: formData.get("decisionMakerId") as string,
        corner: formData.get("corner") as PressureCorner,
        title: formData.get("title") as string,
        description: formData.get("description") as string || undefined,
        status: formData.get("status") as string || undefined,
        powerRating: formData.get("powerRating") as PowerRating,
        weight: formData.get("weight") as string,
    });

    if (data.id) {
        await db.pressureAsset.update({
            where: { id: data.id },
            data: {
                corner: data.corner,
                title: data.title,
                description: data.description,
                status: data.status,
                powerRating: data.powerRating,
                weight: data.weight,
                decisionMakerId: data.decisionMakerId,
            },
        });
    } else {
        await db.pressureAsset.create({
            data: {
                projectId: data.projectId,
                decisionMakerId: data.decisionMakerId,
                corner: data.corner,
                title: data.title,
                description: data.description,
                status: data.status,
                powerRating: data.powerRating,
                weight: data.weight,
            },
        });
    }

    const project = await db.project.findUnique({ where: { id: data.projectId }, select: { slug: true } });
    if (project) {
        revalidatePath(`/projects/${project.slug}/pressure`);
    }
}

const stakeholderSchema = z.object({
    id: z.string().optional(),
    projectId: z.string(),
    name: z.string().min(1, "Name is required"),
    stakeholderType: z.nativeEnum(StakeholderType),
    organization: z.string().optional(),
    notes: z.string().optional(),
    reason: z.string().optional(),
    captains: z.string().optional(),
    planToEducate: z.string().optional(),
    planToCounter: z.string().optional(),
    audience: z.string().optional(),
    plan: z.string().optional(),
    everyActionUrl: z.string().optional(),
    influencers: z.string().optional(),
});

export async function upsertStakeholder(formData: FormData) {
    const data = stakeholderSchema.parse({
        id: formData.get("id") as string || undefined,
        projectId: formData.get("projectId") as string,
        name: formData.get("name") as string,
        stakeholderType: formData.get("stakeholderType") as StakeholderType,
        organization: formData.get("organization") as string || undefined,
        notes: formData.get("notes") as string || undefined,
        reason: formData.get("reason") as string || undefined,
        captains: formData.get("captains") as string || undefined,
        planToEducate: formData.get("planToEducate") as string || undefined,
        planToCounter: formData.get("planToCounter") as string || undefined,
        audience: formData.get("audience") as string || undefined,
        plan: formData.get("plan") as string || undefined,
        everyActionUrl: formData.get("everyActionUrl") as string || undefined,
        influencers: formData.get("influencers") as string || undefined,
    });

    if (data.id) {
        await db.stakeholder.update({
            where: { id: data.id },
            data: {
                name: data.name,
                stakeholderType: data.stakeholderType,
                organization: data.organization,
                notes: data.notes,
                reason: data.reason,
                captains: data.captains,
                planToEducate: data.planToEducate,
                planToCounter: data.planToCounter,
                audience: data.audience,
                plan: data.plan,
                everyActionUrl: data.everyActionUrl,
                influencers: data.influencers,
            },
        });
    } else {
        await db.stakeholder.create({
            data: {
                projectId: data.projectId,
                name: data.name,
                stakeholderType: data.stakeholderType,
                organization: data.organization,
                notes: data.notes,
                reason: data.reason,
                captains: data.captains,
                planToEducate: data.planToEducate,
                planToCounter: data.planToCounter,
                audience: data.audience,
                plan: data.plan,
                everyActionUrl: data.everyActionUrl,
                influencers: data.influencers,
            },
        });
    }

    const project = await db.project.findUnique({ where: { id: data.projectId }, select: { slug: true } });
    if (project) {
        revalidatePath(`/projects/${project.slug}/pressure`);
    }
}

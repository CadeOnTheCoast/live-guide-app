import { PrismaClient, ProjectStatus, ObjectiveStatus, KeyResultStatus, MilestoneStatus, ActivityStatus, AudienceType, CallToActionStatus, UserRole } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function main() {
    const args = process.argv.slice(2);
    const dryRun = args.includes("--dry-run");
    const filePath = args.find(arg => !arg.startsWith("--"));

    if (!filePath) {
        console.error("Usage: npx tsx scripts/ingest-project.ts [--dry-run] <path-to-markdown-file>");
        process.exit(1);
    }

    const content = fs.readFileSync(filePath, "utf-8");
    const data = parseProjectMarkdown(content);

    if (dryRun) {
        console.log("Dry run mode: Data parsed from Markdown:");
        console.log(JSON.stringify(data, null, 2));
        process.exit(0);
    }

    if (!data.slug) {
        console.error("Error: Project slug is required.");
        process.exit(1);
    }

    console.log(`Ingesting project: ${data.name || data.slug}...`);

    try {
        // 1. Upsert Project
        const project = await prisma.project.upsert({
            where: { slug: data.slug },
            update: {
                name: data.name || data.slug,
                status: (data.status as ProjectStatus) || "ACTIVE",
                startDate: data.startDate ? new Date(data.startDate) : null,
                description: data.description || null,
                caseForChangeSummary: data.caseForChangeSummary || null,
                caseForChangePageUrl: data.caseForChangeLink || null,
                asanaUrl: data.asanaUrl || null,
                teamsUrl: data.teamsUrl || null,
                projectFolderUrl: data.filesUrl || null,
                projectNotesUrl: data.notesUrl || null,
                projectUpdateAgendaUrl: data.updateAgendaUrl || null,
                badges: data.badges || [],
            },
            create: {
                slug: data.slug,
                name: data.name || data.slug,
                status: (data.status as ProjectStatus) || "ACTIVE",
                startDate: data.startDate ? new Date(data.startDate) : null,
                description: data.description || null,
                caseForChangeSummary: data.caseForChangeSummary || null,
                caseForChangePageUrl: data.caseForChangeLink || null,
                asanaUrl: data.asanaUrl || null,
                teamsUrl: data.teamsUrl || null,
                projectFolderUrl: data.filesUrl || null,
                projectNotesUrl: data.notesUrl || null,
                projectUpdateAgendaUrl: data.updateAgendaUrl || null,
                badges: data.badges || [],
            },
        });

        console.log(`Project upserted: ${project.id}`);

        // 2. Handle Objectives & Key Results
        for (const obj of data.objectives || []) {
            const objective = await prisma.objective.upsert({
                where: { id: obj.id || "dummy-id" }, // We don't have IDs in MD, but we can match by title for now
                // Matching by title and projectId
                create: {
                    projectId: project.id,
                    title: obj.title,
                    description: obj.description,
                    status: (obj.status as ObjectiveStatus) || "ON_TRACK",
                    timeframeStart: obj.timeframeStart ? new Date(obj.timeframeStart) : null,
                    timeframeEnd: obj.timeframeEnd ? new Date(obj.timeframeEnd) : null,
                    isCurrent: true,
                },
                update: {
                    title: obj.title,
                    description: obj.description,
                    status: (obj.status as ObjectiveStatus) || "ON_TRACK",
                    timeframeStart: obj.timeframeStart ? new Date(obj.timeframeStart) : null,
                    timeframeEnd: obj.timeframeEnd ? new Date(obj.timeframeEnd) : null,
                },
            });

            // Override if we need to find by title instead of ID (MD doesn't have IDs)
            const existingObj = await prisma.objective.findFirst({
                where: { projectId: project.id, title: obj.title }
            });
            const targetObjId = existingObj ? existingObj.id : (await prisma.objective.create({
                data: {
                    projectId: project.id,
                    title: obj.title,
                    description: obj.description,
                    status: (obj.status as ObjectiveStatus) || "ON_TRACK",
                    timeframeStart: obj.timeframeStart ? new Date(obj.timeframeStart) : null,
                    timeframeEnd: obj.timeframeEnd ? new Date(obj.timeframeEnd) : null,
                    isCurrent: true,
                }
            })).id;

            for (const kr of obj.keyResults || []) {
                await prisma.keyResult.upsert({
                    where: {
                        projectId_objectiveId_code: {
                            projectId: project.id,
                            objectiveId: targetObjId,
                            code: kr.code,
                        },
                    },
                    update: {
                        title: kr.title,
                        description: kr.description,
                        targetValue: kr.target,
                        unit: kr.unit,
                        currentValue: kr.current,
                        status: (kr.status as KeyResultStatus) || "GREEN",
                        dueDate: kr.dueDate ? new Date(kr.dueDate) : null,
                    },
                    create: {
                        projectId: project.id,
                        objectiveId: targetObjId,
                        code: kr.code,
                        title: kr.title,
                        description: kr.description,
                        targetValue: kr.target,
                        unit: kr.unit,
                        currentValue: kr.current,
                        status: (kr.status as KeyResultStatus) || "GREEN",
                        dueDate: kr.dueDate ? new Date(kr.dueDate) : null,
                    },
                });
            }
        }

        // 3. Handle Pushes
        for (const p of data.pushes || []) {
            await prisma.push.upsert({
                where: {
                    id: p.id || "dummy-id",
                },
                // We match by sequenceIndex and projectId
                create: {
                    projectId: project.id,
                    sequenceIndex: parseInt(p.number),
                    name: p.label,
                    startDate: new Date(p.startDate),
                    endDate: new Date(p.endDate),
                    highLevelSummary: p.summary,
                    asanaProjectGid: p.asanaGid,
                },
                update: {
                    name: p.label,
                    startDate: new Date(p.startDate),
                    endDate: new Date(p.endDate),
                    highLevelSummary: p.summary,
                    asanaProjectGid: p.asanaGid,
                }
            });

            const existingPush = await prisma.push.findFirst({
                where: { projectId: project.id, sequenceIndex: parseInt(p.number) }
            });
            if (!existingPush) {
                await prisma.push.create({
                    data: {
                        projectId: project.id,
                        sequenceIndex: parseInt(p.number),
                        name: p.label,
                        startDate: new Date(p.startDate),
                        endDate: new Date(p.endDate),
                        highLevelSummary: p.summary,
                        asanaProjectGid: p.asanaGid,
                    }
                });
            } else {
                await prisma.push.update({
                    where: { id: existingPush.id },
                    data: {
                        name: p.label,
                        startDate: new Date(p.startDate),
                        endDate: new Date(p.endDate),
                        highLevelSummary: p.summary,
                        asanaProjectGid: p.asanaGid,
                    }
                });
            }
        }

        // 4. Handle Milestones
        for (const m of data.milestones || []) {
            const push = m.pushNumber ? await prisma.push.findFirst({ where: { projectId: project.id, sequenceIndex: parseInt(m.pushNumber) } }) : null;

            const existingMilestone = await prisma.milestone.findFirst({
                where: { projectId: project.id, title: m.title }
            });

            if (existingMilestone) {
                await prisma.milestone.update({
                    where: { id: existingMilestone.id },
                    data: {
                        description: m.description,
                        date: new Date(m.date),
                        isMajor: m.major?.toLowerCase() === "yes",
                        status: (m.status as MilestoneStatus) || "PLANNED",
                        pushId: push?.id || null,
                    }
                });
            } else {
                await prisma.milestone.create({
                    data: {
                        projectId: project.id,
                        title: m.title,
                        description: m.description,
                        date: new Date(m.date),
                        isMajor: m.major?.toLowerCase() === "yes",
                        status: (m.status as MilestoneStatus) || "PLANNED",
                        pushId: push?.id || null,
                    }
                });
            }
        }

        // 5. Handle Decision Makers
        for (const dm of data.decisionMakers || []) {
            const existingDM = await prisma.decisionMaker.findFirst({
                where: { projectId: project.id, name: dm.name }
            });

            if (existingDM) {
                await prisma.decisionMaker.update({
                    where: { id: existingDM.id },
                    data: {
                        title: dm.title,
                        organization: dm.organization,
                        jurisdiction: dm.jurisdiction,
                        priorityLevel: dm.priority,
                        stance: dm.stance,
                        notes: dm.notes,
                    }
                });
            } else {
                await prisma.decisionMaker.create({
                    data: {
                        projectId: project.id,
                        name: dm.name,
                        title: dm.title,
                        organization: dm.organization,
                        jurisdiction: dm.jurisdiction,
                        priorityLevel: dm.priority,
                        stance: dm.stance,
                        notes: dm.notes,
                    }
                });
            }
        }

        // 6. Handle Comms Plan
        if (data.commsPlan) {
            const commsLead = data.commsPlan.commsLeadEmail ? await prisma.person.findUnique({ where: { email: data.commsPlan.commsLeadEmail } }) : null;
            const backupLead = data.commsPlan.backupLeadEmail ? await prisma.person.findUnique({ where: { email: data.commsPlan.backupLeadEmail } }) : null;

            const commsProfile = await prisma.commsProfile.upsert({
                where: { projectId: project.id },
                update: {
                    commsLeadId: commsLead?.id || null,
                    backupLeadId: backupLead?.id || null,
                    approvalRequired: data.commsPlan.approvalRequired?.toLowerCase() === "yes",
                    approverNotes: data.commsPlan.approverNotes,
                    localNarrative: data.commsPlan.localNarrative,
                    messagingWatchouts: data.commsPlan.messagingWatchouts,
                    riskAndMinefields: data.commsPlan.riskAndMinefields,
                    generalNotes: data.commsPlan.generalNotes,
                },
                create: {
                    projectId: project.id,
                    commsLeadId: commsLead?.id || null,
                    backupLeadId: backupLead?.id || null,
                    approvalRequired: data.commsPlan.approvalRequired?.toLowerCase() === "yes",
                    approverNotes: data.commsPlan.approverNotes,
                    localNarrative: data.commsPlan.localNarrative,
                    messagingWatchouts: data.commsPlan.messagingWatchouts,
                    riskAndMinefields: data.commsPlan.riskAndMinefields,
                    generalNotes: data.commsPlan.generalNotes,
                },
            });

            // Key Messages
            for (const msg of data.commsPlan.keyMessages || []) {
                const existingMsg = await prisma.keyMessage.findFirst({
                    where: { projectId: project.id, commsProfileId: commsProfile.id, text: msg.text }
                });
                if (!existingMsg) {
                    await prisma.keyMessage.create({
                        data: {
                            projectId: project.id,
                            commsProfileId: commsProfile.id,
                            audience: (msg.audience as AudienceType) || "EXTERNAL",
                            text: msg.text,
                            priorityOrder: parseInt(msg.priority) || 0,
                        }
                    });
                }
            }

            // FAQs
            for (const faq of data.commsPlan.faqs || []) {
                const existingFaq = await prisma.commsFaq.findFirst({
                    where: { projectId: project.id, commsProfileId: commsProfile.id, question: faq.question }
                });
                if (!existingFaq) {
                    await prisma.commsFaq.create({
                        data: {
                            projectId: project.id,
                            commsProfileId: commsProfile.id,
                            question: faq.question,
                            answer: faq.answer,
                            priorityOrder: parseInt(faq.priority) || 0,
                        }
                    });
                }
            }

            // CTAs
            for (const cta of data.commsPlan.ctas || []) {
                const existingCta = await prisma.callToAction.findFirst({
                    where: { projectId: project.id, commsProfileId: commsProfile.id, description: cta.description }
                });
                if (!existingCta) {
                    await prisma.callToAction.create({
                        data: {
                            projectId: project.id,
                            commsProfileId: commsProfile.id,
                            description: cta.description,
                            url: cta.url,
                            status: (cta.status as CallToActionStatus) || "ACTIVE",
                        }
                    });
                }
            }
        }

        console.log("Ingestion complete!");
    } catch (error) {
        console.error("Ingestion failed:", error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

function parseProjectMarkdown(content: string) {
    const data: any = {
        objectives: [],
        pushes: [],
        milestones: [],
        decisionMakers: [],
        commsPlan: {
            keyMessages: [],
            faqs: [],
            ctas: [],
        },
    };

    const sections = content.split(/^#+ /m);

    for (const section of sections) {
        const lines = section.trim().split("\n");
        const title = lines[0].trim();
        const body = lines.slice(1).join("\n");

        if (title.startsWith("Project Data Template:")) {
            // Ignore header
        } else if (title === "Project Overview") {
            data.slug = extractValue(body, "Slug");
            data.name = extractValue(body, "Name");
            data.status = extractValue(body, "Status");
            data.startDate = extractValue(body, "Start Date");
            data.primaryOwnerEmail = extractValue(body, "Primary Owner Email");
            data.description = extractValue(body, "Short Description");
            const badgesRaw = extractValue(body, "Badges");
            data.badges = badgesRaw ? badgesRaw.split(",").map((s: string) => s.trim()) : [];
        } else if (title === "Case for Change") {
            data.caseForChangeSummary = extractValue(body, "Summary");
            data.caseForChangeLink = extractValue(body, "Link");
        } else if (title === "External Links") {
            data.teamsUrl = extractValue(body, "Teams URL");
            data.asanaUrl = extractValue(body, "Asana URL");
            data.filesUrl = extractValue(body, "Files Folder URL");
            data.notesUrl = extractValue(body, "Project Notes URL");
            data.updateAgendaUrl = extractValue(body, "Update Agenda URL");
        } else if (title.startsWith("Objective:")) {
            const objTitle = title.replace("Objective:", "").trim();
            const obj: any = {
                title: objTitle,
                description: extractValue(body, "Description"),
                status: extractValue(body, "Status"),
                timeframeStart: extractValue(body, "Timeframe Start"),
                timeframeEnd: extractValue(body, "Timeframe End"),
                keyResults: [],
            };

            // Parse Key Results Table
            const table = extractTable(body);
            if (table) {
                obj.keyResults = table.map((row: any) => ({
                    code: row["KR Code"],
                    title: row["Title"],
                    description: row["Description"],
                    target: row["Target"],
                    unit: row["Unit"],
                    current: row["Current"],
                    status: row["Status"],
                    dueDate: row["Due Date"],
                    ownerEmail: row["Owner Email"],
                }));
            }
            data.objectives.push(obj);
        } else if (title === "Timeline") {
            // Timeline has subheaders or multiple tables
        } else if (title === "Pushes") {
            const table = extractTable(body);
            if (table) {
                data.pushes = table.map((row: any) => ({
                    number: row["#"],
                    label: row["Label"],
                    startDate: row["Start Date"],
                    endDate: row["End Date"],
                    summary: row["Summary"],
                    asanaGid: row["Asana Project GID"],
                }));
            }
        } else if (title === "Milestones") {
            const table = extractTable(body);
            if (table) {
                data.milestones = table.map((row: any) => ({
                    title: row["Title"],
                    description: row["Description"],
                    date: row["Date"],
                    major: row["Major?"],
                    status: row["Status"],
                    deptCode: row["Lead Dept Code"],
                    pushNumber: row["Push #"],
                }));
            }
        } else if (title === "Decision Makers") {
            const table = extractTable(body);
            if (table) {
                data.decisionMakers = table.map((row: any) => ({
                    name: row["Name"],
                    title: row["Title"],
                    organization: row["Organization"],
                    jurisdiction: row["Jurisdiction"],
                    priority: row["Priority"],
                    stance: row["Stance"],
                    notes: row["Notes"],
                }));
            }
        } else if (title === "Communications Plan") {
            data.commsPlan.commsLeadEmail = extractValue(body, "Comms Lead Email");
            data.commsPlan.backupLeadEmail = extractValue(body, "Backup Lead Email");
            data.commsPlan.approvalRequired = extractValue(body, "Approval Required");
            data.commsPlan.approverNotes = extractValue(body, "Approver Notes");
            data.commsPlan.localNarrative = extractValue(body, "Local Narrative");
            data.commsPlan.messagingWatchouts = extractValue(body, "Messaging Watchouts");
            data.commsPlan.riskAndMinefields = extractValue(body, "Risk & Minefields");
            data.commsPlan.generalNotes = extractValue(body, "General Notes");
        } else if (title === "Key Messages") {
            const table = extractTable(body);
            if (table) {
                data.commsPlan.keyMessages = table.map((row: any) => ({
                    audience: row["Audience"],
                    text: row["Text"],
                    priority: row["Priority"],
                }));
            }
        } else if (title === "FAQ") {
            const table = extractTable(body);
            if (table) {
                data.commsPlan.faqs = table.map((row: any) => ({
                    question: row["Question"],
                    answer: row["Answer"],
                    priority: row["Priority"],
                }));
            }
        } else if (title === "Calls to Action") {
            const table = extractTable(body);
            if (table) {
                data.commsPlan.ctas = table.map((row: any) => ({
                    description: row["Description"],
                    url: row["URL"],
                    status: row["Status"],
                }));
            }
        }
    }

    return data;
}

function extractValue(body: string, key: string) {
    const regex = new RegExp(`- \\*\\*${key}\\*\\*: (.*)`, "i");
    const match = body.match(regex);
    const val = match ? match[1].trim() : null;
    // Strip brackets if user kept placeholder
    if (val && val.startsWith("[") && val.endsWith("]")) return null;
    return val;
}

function extractTable(body: string) {
    const lines = body.trim().split("\n");
    const tableLines = lines.filter((l) => l.trim().startsWith("|"));
    if (tableLines.length < 3) return null;

    const headers = tableLines[0]
        .split("|")
        .map((s) => s.trim())
        .filter((s) => s !== "");

    const rows = tableLines.slice(2).map((line) => {
        const values = line
            .split("|")
            .map((s) => s.trim())
            .filter((s, i, arr) => i > 0 && i < arr.length - 1);
        const row: any = {};
        headers.forEach((header, i) => {
            let val = values[i] || null;
            if (val && val.startsWith("[") && val.endsWith("]")) val = null;
            row[header] = val;
        });
        return row;
    });

    return rows;
}

main();

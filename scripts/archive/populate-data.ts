import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
    const mudDumpingSlug = "mud-dumping";

    // 1. Update Mud Dumping Project Info & Links
    await prisma.project.update({
        where: { slug: mudDumpingSlug },
        data: {
            historyDebrief: "In-Bay disposal of maintenance dredge spoil ('federal mud-dumping') was banned in Mobile Bay from 1986-2012 due to environmental concerns. In 2012, USACE received emergency permission to resume the practice, citing budget constraints. Baykeeper has since authoring papers disputing the Corps' position and submitted over 60 pages of comment letters detailing harms. In 2023, commercial fishermen and charter captains raised alarms about declining fish stocks. In 2024, scientific findings confirmed Gulf Sturgeon presence in Mobile Bay.",
            caseForChangePageUrl: "https://mobilebaykeeper.sharepoint.com/:w:/s/TeamMobileBaykeeper/IQBN-AoCGGP5QJnPVh0UXnkMAYbo4_3soI68kqWvWhIw3Bk?e=eqJpTS",
            badges: ["Oyster Revival", "Seagrass Restoration"],
            asanaUrl: "https://app.asana.com/1/52630705087449/project/1204107082259395/list/1204107546983433",
            teamsUrl: "https://teams.microsoft.com/l/channel/19%3A1I7UP0jaWWUxbd7MI7HlU2-CS6uWiNbi9lTWA-KxTU01%40thread.tacv2/Mud%20Dumping%20Project?groupId=b1754904-8545-4d34-8f8e-8484fb47659b&tenantId=cf805e36-3954-4b13-b9c7-40cf4889a25d",
            projectNotesUrl: "https://mobilebaykeeper.sharepoint.com/sites/MobileBaykeeperProjects/_layouts/Doc.aspx?sourcedoc={FED06262-1F4B-44B1-B846-3A7185560970}&wd=target%28Mud%20Dumping.one%7C396C7338-C5E8-45C1-9C8E-0333B5AF6928%2F%29&wdsectionfileid={396C7338-C5E8-45C1-9C8E-0333B5AF6928}",
            projectFolderUrl: "https://mobilebaykeeper.sharepoint.com/:f:/s/TeamMobileBaykeeper/IgDAcg0xHRUQTqMk9wHNcEBvAe8wSSux_PJ0zlW4cOEAPpI?e=8QNPMd"
        }
    });

    // 2. Add Key Results for Mud Dumping
    const mudDumping = await prisma.project.findUnique({ where: { slug: mudDumpingSlug } });
    if (mudDumping) {
        // Find or create an objective
        let objective = await prisma.objective.findFirst({ where: { projectId: mudDumping.id, isCurrent: true } });
        if (!objective) {
            objective = await prisma.objective.create({
                data: {
                    projectId: mudDumping.id,
                    title: "Halt ecological damage caused by dredge spoil disposal in Mobile Bay",
                    description: "Ensuring the protection of seagrasses, oysters, and the Gulf Sturgeon.",
                    isCurrent: true,
                    status: "ON_TRACK"
                }
            });
        }

        const krData = [
            {
                code: "KR1",
                title: "Ensure 70% of dredge material is disposed of beneficially",
                targetValue: "70",
                unit: "%",
                status: "GREEN" as const,
                dueDate: new Date("2027-12-31")
            },
            {
                code: "KR2",
                title: "Secure $25 million in funding for offshore disposal or alternative beneficial methods",
                targetValue: "25000000",
                unit: "$",
                status: "YELLOW" as const,
                dueDate: new Date("2025-12-01")
            },
            {
                code: "KR3",
                title: "Secure language in WRDA 2026 to cease in-bay disposal in Mobile Bay",
                targetValue: "1",
                unit: "act",
                status: "RED" as const,
                dueDate: new Date("2026-12-31")
            }
        ];

        for (const kr of krData) {
            await prisma.keyResult.upsert({
                where: {
                    projectId_objectiveId_code: {
                        projectId: mudDumping.id,
                        objectiveId: objective.id,
                        code: kr.code
                    }
                },
                update: kr,
                create: {
                    ...kr,
                    projectId: mudDumping.id,
                    objectiveId: objective.id
                }
            });
        }

        // 4. Add Activities for Mud Dumping (Current Push)
        const currentPush = await prisma.push.findFirst({
            where: { projectId: mudDumping.id, startDate: { lte: new Date() }, endDate: { gte: new Date() } }
        }) || await prisma.push.findFirst({
            where: { projectId: mudDumping.id },
            orderBy: { startDate: "desc" }
        });

        if (currentPush) {
            const people = await prisma.person.findMany({
                where: { name: { in: ["Chris Elliott", "Cade Kistler", "William Strickland"] } }
            });
            const personMap = Object.fromEntries(people.map(p => [p.name, p.id]));

            const activityData = [
                {
                    title: "Draft house bill on dredging / sediment controls",
                    dueDate: new Date("2024-12-23"),
                    ownerId: personMap["Chris Elliott"],
                    status: "NOT_STARTED" as const
                },
                {
                    title: "Set up meeting with the Port",
                    dueDate: new Date("2025-01-05"),
                    ownerId: personMap["Cade Kistler"],
                    status: "NOT_STARTED" as const
                },
                {
                    title: "Draft press release for Mud Dumping issue",
                    dueDate: new Date("2025-01-15"),
                    ownerId: personMap["Cade Kistler"],
                    status: "NOT_STARTED" as const
                },
                {
                    title: "Send muddy water email to list-serv",
                    dueDate: new Date("2025-01-20"),
                    ownerId: personMap["Cade Kistler"],
                    status: "NOT_STARTED" as const
                },
                {
                    title: "Follow up with Senator Britt's office",
                    dueDate: new Date("2025-02-01"),
                    ownerId: personMap["William Strickland"],
                    status: "NOT_STARTED" as const
                },
                {
                    title: "Coordinate with stakeholders on messaging",
                    dueDate: new Date("2025-02-15"),
                    ownerId: personMap["Cade Kistler"],
                    status: "NOT_STARTED" as const
                }
            ];

            for (const act of activityData) {
                await prisma.activity.create({
                    data: {
                        ...act,
                        projectId: mudDumping.id,
                        pushId: currentPush.id
                    }
                });
            }
        }
    }

    // 3. Assign badges to other projects (example)
    const otherProjectsBadges: Record<string, string[]> = {
        "toxics-criteria": ["Fish Consumption"],
        "oyster-farm": ["Oyster Revival"],
        "oyster-hatchery": ["Oyster Revival"],
        "oyster-planting": ["Oyster Revival"],
        "oyster-keeper": ["Oyster Revival"],
        "coal-ash-plant-barry": ["Fish Consumption"],
        "hog-bayou": ["Fish Consumption"],
        "prichard-wastewater": ["Swimming Safety"],
        "bcss-malbis-wwtp-compliance": ["Swimming Safety"],
        "claiborne-millers-ferry-dam-impact-assessment": ["SAV", "Oyster"]
    };

    for (const [slug, badges] of Object.entries(otherProjectsBadges)) {
        await prisma.project.updateMany({
            where: { slug },
            data: { badges }
        });
    }

    console.log("Data population complete.");
}

main().finally(() => prisma.$disconnect());

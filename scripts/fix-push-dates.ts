
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const updates = [
        { slug: "mud-dumping", start: "2025-11-04" },
        { slug: "coal-ash-plant-barry", start: "2025-12-02" },
        { slug: "toxics-criteria", start: "2025-12-09" },
        { slug: "hog-bayou", start: "2025-12-09" },
        { slug: "prichard-wastewater", start: "2025-12-16" },
        { slug: "bcss-malbis-wwtp-compliance", start: "2025-11-18" },
        { slug: "claiborne-millers-ferry-dam-impact-assessment", start: "2025-11-25" },
    ];

    for (const item of updates) {
        const project = await prisma.project.findUnique({ where: { slug: item.slug } });
        if (!project) {
            console.log(`Project ${item.slug} not found`);
            continue;
        }

        const startDate = new Date(item.start);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 56); // 8 weeks

        const existing = await prisma.push.findFirst({
            where: { projectId: project.id, sequenceIndex: 1 }
        });

        const data = {
            name: `Push 1 - ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
            startDate,
            endDate,
            projectId: project.id,
            sequenceIndex: 1
        };

        if (existing) {
            await prisma.push.update({
                where: { id: existing.id },
                data
            });
        } else {
            await prisma.push.create({
                data
            });
        }

        console.log(`Updated ${item.slug}: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

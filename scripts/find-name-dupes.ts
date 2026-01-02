import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const projects = await prisma.project.findMany({
        where: { isActive: true },
        select: {
            id: true,
            name: true,
            slug: true,
            _count: {
                select: { budgetLines: true }
            }
        }
    });

    const nameMap: Record<string, typeof projects> = {};
    projects.forEach(p => {
        if (!nameMap[p.name]) nameMap[p.name] = [];
        nameMap[p.name].push(p);
    });

    const duplicates = Object.entries(nameMap).filter(([name, list]) => list.length > 1);
    console.log(JSON.stringify(duplicates, null, 2));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

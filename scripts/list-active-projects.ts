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
        },
        orderBy: { name: 'asc' }
    });
    console.log(JSON.stringify(projects, null, 2));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

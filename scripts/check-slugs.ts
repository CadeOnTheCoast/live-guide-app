import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const projects = await prisma.project.findMany({
        select: { slug: true, name: true }
    });
    console.log("Projects in DB:");
    projects.forEach(p => console.log(`${p.slug} (${p.name})`));
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());

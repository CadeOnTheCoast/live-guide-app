import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
    const projects = await prisma.project.findMany({ select: { name: true, slug: true } });
    console.log(JSON.stringify(projects, null, 2));
}
main().finally(() => prisma.$disconnect());

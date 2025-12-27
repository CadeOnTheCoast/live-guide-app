import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
    const slug = "mud-dumping";
    const project = await prisma.project.findUnique({ where: { slug } });
    if (!project) return;

    console.log("Cleaning up duplicates for mud-dumping...");

    await prisma.keyMessage.deleteMany({ where: { projectId: project.id } });
    await prisma.callToAction.deleteMany({ where: { projectId: project.id } });
    await prisma.commsFaq.deleteMany({ where: { projectId: project.id } });
    await prisma.commsFrame.deleteMany({ where: { projectId: project.id } });

    console.log("Cleanup complete.");
}
main().finally(() => prisma.$disconnect());

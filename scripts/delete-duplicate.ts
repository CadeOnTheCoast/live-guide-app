import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const slugToDelete = 'dam-removal';

    const project = await prisma.project.findUnique({
        where: { slug: slugToDelete },
        include: { objectives: true }
    });

    if (project) {
        console.log(`Cleaning up project: ${project.name} (${project.slug})`);

        // Delete KeyResults
        await prisma.keyResult.deleteMany({
            where: { projectId: project.id }
        });
        console.log('KeyResults deleted.');

        // Delete Objectives
        await prisma.objective.deleteMany({
            where: { projectId: project.id }
        });
        console.log('Objectives deleted.');

        // Delete Pushes
        await prisma.push.deleteMany({
            where: { projectId: project.id }
        });
        console.log('Pushes deleted.');

        // Delete Project
        await prisma.project.delete({
            where: { slug: slugToDelete }
        });
        console.log('Project deleted.');
    } else {
        console.log('Project not found, nothing to delete.');
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // 1. Update Departments
    console.log('Updating departments...');
    await prisma.department.upsert({
        where: { code: 'FR' },
        update: { name: 'Field and Research' },
        create: { code: 'FR', name: 'Field and Research' }
    });
    await prisma.department.upsert({
        where: { code: 'CE' },
        update: { name: 'Community Engagement' },
        create: { code: 'CE', name: 'Community Engagement' }
    });

    // 2. Remove "artifact" departments
    console.log('Removing artifact departments...');
    await prisma.department.deleteMany({
        where: {
            code: { in: ['LEGAL', 'deliverables'] }
        }
    });

    // 3. Delete placeholder projects
    console.log('Deleting placeholder projects...');
    const projectSlugsToDelete = ['watershed-restoration', 'community-outreach', 'habitat-monitoring'];
    for (const slug of projectSlugsToDelete) {
        // Check if project exists
        const p = await prisma.project.findUnique({ where: { slug } });
        if (p) {
            // Delete related records or let cascade handle if configured
            // Prisma schema doesn't seem to have explicit cascades on everything, 
            // but let's try deleteMany for safety if needed. 
            // For now, simple delete.
            await prisma.project.delete({ where: { slug } });
        }
    }

    // 4. Add missing projects
    console.log('Adding missing projects...');
    const owner = await prisma.person.findFirst({ where: { email: 'ckistler@mobilebaykeeper.org' } });

    const newProjects = [
        { name: 'Toxics Criteria', slug: 'toxics-criteria' },
        { name: 'Oyster Farm', slug: 'oyster-farm' }
    ];

    for (const proj of newProjects) {
        await prisma.project.upsert({
            where: { slug: proj.slug },
            update: { name: proj.name },
            create: {
                name: proj.name,
                slug: proj.slug,
                primaryOwnerId: owner?.id
            }
        });
    }

    console.log('Cleanup complete.');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

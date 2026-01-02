import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const people = await prisma.person.findMany({
        select: { id: true, name: true, email: true }
    });
    const projects = await prisma.project.findMany({
        select: { id: true, name: true, slug: true }
    });
    const departments = await prisma.department.findMany({
        select: { id: true, name: true, code: true }
    });

    console.log('PEOPLE:', JSON.stringify(people, null, 2));
    console.log('PROJECTS:', JSON.stringify(projects, null, 2));
    console.log('DEPARTMENTS:', JSON.stringify(departments, null, 2));
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

import { PrismaClient } from "@prisma/client";
import path from "path";
import fs from "fs";

const prisma = new PrismaClient();

async function main() {
    const projects = await prisma.project.findMany();
    console.table(projects.map(p => ({ trName: p.name, Slug: p.slug, ID: p.id })));
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function test() {
    try {
        console.log("Connecting to database...");
        const count = await prisma.project.count();
        console.log(`Connection successful. Found ${count} projects.`);
    } catch (e) {
        console.error("Connection failed:", e);
    } finally {
        await prisma.$disconnect();
    }
}

test();

import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";

const prisma = new PrismaClient();

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface StaffRow {
    name: string;
    rate: number;
    hours: number[]; // 12 months
}

function parseStaffFile(filePath: string): StaffRow[] {
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");
    const result: StaffRow[] = [];

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        // Skip headers
        if (
            trimmed.startsWith("Grant type") ||
            trimmed.startsWith("Staff (hours)") ||
            trimmed.startsWith("Total Project Cost")
        ) continue;

        // Expected format: Name \t Rate \t Jan \t Feb ...
        // Rate might be "$64.29 " or "$-"
        const parts = line.split("\t").map(p => p.trim());

        // Name is first
        const name = parts[0];
        if (!name || name === "Totals" || name === "TOTAL") continue;

        // Rate is second
        // const rateStr = parts[1]; // We don't store rate in StaffAllocation, but good to know it exists

        // Hours are indices 2 to 13 (Jan to Dec)
        const hours: number[] = [];
        for (let i = 2; i < 14; i++) {
            const valStr = parts[i];
            const val = valStr ? parseFloat(valStr.replace(/[$,]/g, "")) : 0;
            hours.push(isNaN(val) ? 0 : val);
        }

        // Only add if there are any hours > 0
        if (hours.some(h => h > 0)) {
            result.push({
                name,
                rate: 0, // Placeholder
                hours
            });
        }
    }
    return result;
}

// Helper to generate a standardized email for unknown people
function generateEmail(name: string): string {
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, ".").replace(/\.+/g, ".");
    return `${slug}@placeholder.liveguide.local`;
}

async function main() {
    const argv = await yargs(hideBin(process.argv))
        .option("slug", { type: "string", demandOption: true, description: "Project Slug (DB)" })
        .option("file", { type: "string", demandOption: true, description: "Path to raw data file" })
        .help()
        .argv;

    const { slug, file } = argv;
    const filePath = path.resolve(file);

    if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        process.exit(1);
    }

    const project = await prisma.project.findFirst({ where: { slug } });
    if (!project) {
        console.error(`Project not found in DB: ${slug}`);
        process.exit(1);
    }

    console.log(`\n=== Ingesting Staff Allocation for: ${project.name} (${slug}) ===`);

    const staffRows = parseStaffFile(filePath);
    console.log(`Parsed ${staffRows.length} staff rows.`);

    const allocationsToCreate: any[] = [];

    for (const row of staffRows) {
        // Find Person
        let person = await prisma.person.findFirst({
            where: { name: { equals: row.name, mode: "insensitive" } }
        });

        if (!person) {
            const email = generateEmail(row.name);
            console.log(`[Person] "${row.name}" not found. Creating placeholder: ${email}`);

            // Upsert in case the email already exists but name was different
            person = await prisma.person.upsert({
                where: { email },
                update: { name: row.name },
                create: {
                    name: row.name,
                    email,
                    role: "VIEWER",
                    isActive: false // Placeholder users are inactive
                }
            });
        }

        // Create 12 allocation records
        // Using "period" format "Jan 2026" to match budget lines
        row.hours.forEach((h, idx) => {
            if (h > 0) {
                allocationsToCreate.push({
                    projectId: project.id,
                    personId: person!.id,
                    period: `${MONTHS[idx]} 2026`,
                    hours: h,
                    notes: null
                });
            }
        });
    }

    if (allocationsToCreate.length > 0) {
        console.log(`\n[DB] Deleting existing allocations for ${project.name}...`);
        await prisma.staffAllocation.deleteMany({ where: { projectId: project.id } });

        console.log(`[DB] Inserting ${allocationsToCreate.length} new allocations...`);
        const result = await prisma.staffAllocation.createMany({ data: allocationsToCreate });
        console.log(`[Success] Inserted ${result.count} records.`);
    } else {
        console.log(`[Warning] No allocations to insert.`);
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

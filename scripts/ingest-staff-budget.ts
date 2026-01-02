import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";

const prisma = new PrismaClient();

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface StaffExpenseRow {
    name: string;
    rate: number;
    monthlyCosts: number[]; // 12 months
}

function parseStaffExpenseFile(filePath: string): StaffExpenseRow[] {
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");
    const rowMap = new Map<string, StaffExpenseRow>();

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        // Skip headers
        if (
            trimmed.startsWith("Staff (expense)") ||
            trimmed.startsWith("Totals")
        ) continue;

        const parts = line.split("\t").map(p => p.trim());

        const name = parts[0];
        if (!name || name === "Totals" || name === "TOTAL") continue;

        const rateStr = parts[1];
        const rate = rateStr ? parseFloat(rateStr.replace(/[$,]/g, "")) : 0;

        // Monthly Costs are indices 2 to 13 (Jan to Dec)
        const monthlyCosts: number[] = [];
        for (let i = 2; i < 14; i++) {
            const valStr = parts[i];
            const val = valStr ? parseFloat(valStr.replace(/[$,\s]/g, "").replace(/\((.*)\)/, "-$1")) : 0;
            monthlyCosts.push(isNaN(val) ? 0 : val);
        }

        // Aggregate by Name
        if (rowMap.has(name)) {
            const existing = rowMap.get(name)!;
            // Add costs
            existing.monthlyCosts = existing.monthlyCosts.map((c, i) => c + monthlyCosts[i]);
            // Update rate if current is non-zero (assume latest or max rate)
            if (rate > 0) existing.rate = rate;
        } else {
            // Only add if there are any costs > 0 or it's a valid row
            // Actually, for duplicates, we might have split rows where one is 0 and another is not.
            // But if it's the first time seeing it, let's add it.
            if (monthlyCosts.some(c => c !== 0) || rate > 0) {
                rowMap.set(name, {
                    name,
                    rate,
                    monthlyCosts
                });
            }
        }
    }
    return Array.from(rowMap.values());
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

    console.log(`\n=== Ingesting Staff Expenses for: ${project.name} (${slug}) ===`);

    const staffRows = parseStaffExpenseFile(filePath);
    console.log(`Parsed ${staffRows.length} unique staff rows.`);

    const budgetLinesToCreate: any[] = [];

    for (const row of staffRows) {
        row.monthlyCosts.forEach((cost, idx) => {
            // Create a record for every month to ensure Grid View continuity
            budgetLinesToCreate.push({
                projectId: project.id,
                category: "Staffing",
                description: row.name,
                amount: cost,
                unitCost: null,
                quantity: null,
                period: `${MONTHS[idx]} 2026`,
                notes: row.rate > 0 ? `Rate: $${row.rate}/hr` : null
            });
        });
    }

    if (budgetLinesToCreate.length > 0) {
        console.log(`\n[DB] Deleting existing 'Staffing' budget lines...`);
        // Only delete Staffing lines
        await prisma.budgetLine.deleteMany({
            where: {
                projectId: project.id,
                category: "Staffing"
            }
        });

        console.log(`[DB] Inserting ${budgetLinesToCreate.length} new budget lines...`);
        const result = await prisma.budgetLine.createMany({ data: budgetLinesToCreate });
        console.log(`[Success] Inserted ${result.count} records.`);
    } else {
        console.log(`[Warning] No staff expenses to insert.`);
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

import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";

const prisma = new PrismaClient();

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface BudgetLineInput {
    account: string;
    description: string;
    unitCost: number | null;
    quantity: number | null;
    totalCost: number;
    calendar: string;
    notes: string;
}

// Map months to 0-indexed integers
const MONTH_MAP: Record<string, number> = {
    january: 0, jan: 0,
    february: 1, feb: 1,
    march: 2, mar: 2,
    april: 3, apr: 3,
    may: 4,
    june: 5, jun: 5,
    july: 6, jul: 6,
    august: 7, aug: 7,
    september: 8, sep: 8, sept: 8,
    october: 9, oct: 9,
    november: 10, nov: 10,
    december: 11, dec: 11
};

// Map quarters to month indices
const QUARTER_MAP: Record<string, number[]> = {
    q1: [0, 1, 2],
    q2: [3, 4, 5],
    q3: [6, 7, 8],
    q4: [9, 10, 11]
};

function parseCost(val: string): number {
    if (!val) return 0;
    return parseFloat(val.replace(/[$,\s]/g, "").replace(/\((.*)\)/, "-$1")) || 0;
}

function getMonthsFromCalendar(calendarStr: string): number[] {
    const lower = calendarStr.toLowerCase().trim();
    if (!lower || lower === "monthly" || lower === "") {
        return Array.from({ length: 12 }, (_, i) => i); // All months
    }

    const months = new Set<number>();

    // Split by common delimiters
    const parts = lower.split(/[,&/]/).map(p => p.trim());

    for (const part of parts) {
        if (MONTH_MAP[part] !== undefined) {
            months.add(MONTH_MAP[part]);
        } else if (QUARTER_MAP[part]) {
            QUARTER_MAP[part].forEach(m => months.add(m));
        }
    }

    if (months.size === 0) {
        console.warn(`Warning: Could not parse calendar string "${calendarStr}". Defaulting to Monthly.`);
        return Array.from({ length: 12 }, (_, i) => i);
    }

    return Array.from(months).sort((a, b) => a - b);
}

function parseBudgetFile(filePath: string): { category: string, lines: BudgetLineInput[] }[] {
    const content = fs.readFileSync(filePath, "utf-8");
    const docLines = content.split("\n");

    const result: { category: string, lines: BudgetLineInput[] }[] = [];
    let currentCategory = "Uncategorized";

    for (const line of docLines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        // Skip headers
        if (trimmed.startsWith("Account") || trimmed.startsWith("Totals") || trimmed.startsWith("Coal Ash")) continue;

        const parts = line.split("\t").map(p => p.trim());

        // Heuristic: If line doesn't start with a number, it's likely a Category Header
        // Example: "Programs: Field Investigation"
        // But be careful of lines that are just notes or short text.
        // Budget lines usually start with 4-digit code.
        const isBudgetLine = /^\d{4}/.test(parts[0]);

        if (!isBudgetLine) {
            // It's a header or junk
            // Check if it looks like a category (has letters, maybe colons)
            if (parts[0].length > 3 && !parts[0].startsWith("$")) {
                currentCategory = parts[0];
            }
            continue;
        }

        // Parse Budget Line
        // Columns based on user sample:
        // 0: Account (e.g., "4040 Printing")
        // 1: What (ignored if merged, or part of desc)
        // 2: Explained (Description)
        // 3: Unit Cost
        // 4: Quantity
        // 5: Cost (Total)
        // 6: Calendar Breakout
        // 7: Notes

        // Sometimes "What" and "Explained" need merging
        // User sample: 
        // 4040 Printing | Printed leave-behinds | One-pagers...
        // 7305 Baykeeper Boat | Ash Pond | 3 trips...

        const account = parts[0];
        const what = parts[1];
        const explained = parts[2];
        const unitCostStr = parts[3];
        const quantityStr = parts[4];
        const totalCostStr = parts[5];
        const calendar = parts[6] || "";
        const notes = parts[7] || "";

        const description = [what, explained].filter(s => s && s !== "$-").join(" - ");

        // If "$-" in cost columns, treat as 0 or null
        const unitCost = unitCostStr && unitCostStr !== "$-" ? parseCost(unitCostStr) : null;
        const quantity = quantityStr && quantityStr !== "$-" ? parseCost(quantityStr) : null;
        const totalCost = parseCost(totalCostStr);

        // Only add if there is a cost or meaningful narrative
        if (totalCost === 0 && !notes && !description) continue;

        // Add to result
        // Find or create category group
        let catGroup = result.find(c => c.category === currentCategory);
        if (!catGroup) {
            catGroup = { category: currentCategory, lines: [] };
            result.push(catGroup);
        }

        catGroup.lines.push({
            account,
            description,
            unitCost,
            quantity,
            totalCost,
            calendar,
            notes
        });
    }

    return result;
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

    console.log(`\n=== Ingesting Budget for: ${project.name} (${slug}) ===`);

    // 1. Backup Existing Data
    const validLines = await prisma.budgetLine.findMany({ where: { projectId: project.id } });
    if (validLines.length > 0) {
        const backupDir = path.resolve("data/backups");
        if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const backupPath = path.join(backupDir, `${slug}-budget-backup-${timestamp}.json`);

        fs.writeFileSync(backupPath, JSON.stringify(validLines, null, 2));
        console.log(`\n[Backup] Saved ${validLines.length} existing lines to: ${backupPath}`);
    } else {
        console.log("\n[Backup] No existing budget lines found. Skipping backup.");
    }

    // 2. Parse New Data
    console.log(`\n[Parsing] Reading ${filePath}...`);
    const parsedData = parseBudgetFile(filePath);

    let totalLinesToInsert = 0;
    const budgetLinesToCreate: any[] = [];

    for (const group of parsedData) {
        // We use the "Category" from the file as the GROUPING in code, but typically 
        // the "Account" (e.g., 4040 Printing) is used as the 'category' field in DB 
        // to group rows in the UI. 
        // However, the user wants "Category header where it should be a description".
        // The UI groups by `category` field. 
        // In previous script: `category: account` (e.g., "4040 Printing").
        // The "Category Header" from text file (e.g. "Operations: Facilities...") isn't effectively stored 
        // unless we prepend it or use it as a tag. 
        // Let's stick to: `category` = Account Code + Name (e.g. "4040 Printing").
        // And `description` = The parsed description.
        // We can append the "Section" (Facilities etc) to notes if needed, but usually Account Code implies it.

        for (const line of group.lines) {
            const monthsIndices = getMonthsFromCalendar(line.calendar);
            const monthlyCost = line.totalCost / monthsIndices.length;

            // Distribute across periods
            // We need to create a line for EVERY month? Or just the active ones?
            // The DB schema likely stores one record per month per item? Or one record per item?
            // Checking previous script:
            // "monthlyAmounts.forEach((amount, idx) => { ... budgetLinesToCreate.push({ ... period: `${months[idx]} 2026` ... }) })"
            // Yes, it creates 1 row per month.

            // So for each month index 0-11:
            for (let i = 0; i < 12; i++) {
                const isActiveMonth = monthsIndices.includes(i);
                const amount = isActiveMonth ? monthlyCost : 0;

                // Only create row if amount > 0 OR if it's the first month and we want to show the line item existence?
                // The Grid UI shows all months. We probably need at least one entry or all 12?
                // If we want the line to appear in the table, we usually need rows. 
                // Creating all 12 is safest for the "Matrix" view.

                // Optimization: If totalCost is 0, maybe just create 1 row or skip?
                // If we skip, it won't show in UI. Let's create all 12 to be safe for the grid.

                budgetLinesToCreate.push({
                    projectId: project.id,
                    category: line.account, // "4040 Printing"
                    description: line.description || "Unspecified",
                    amount: amount,
                    unitCost: line.unitCost,
                    quantity: line.quantity,
                    period: `${MONTHS[i]} 2026`,
                    notes: line.notes + (group.category !== "Uncategorized" ? `\n[Section: ${group.category}]` : "")
                });
            }
        }
    }

    console.log(`[Prepared] Ready to insert ${budgetLinesToCreate.length} records.`);

    // 3. Execute DB Actions
    if (budgetLinesToCreate.length > 0) {
        console.log(`\n[DB] Deleting old records (preserving Staffing)...`);
        await prisma.budgetLine.deleteMany({
            where: {
                projectId: project.id,
                category: { not: "Staffing" }
            }
        });

        console.log(`[DB] Inserting new records...`);
        const result = await prisma.budgetLine.createMany({ data: budgetLinesToCreate });
        console.log(`[Success] Inserted ${result.count} lines.`);
    } else {
        console.log(`[Warning] No lines to insert.`);
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

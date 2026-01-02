import { PrismaClient } from "@prisma/client";
import { parse } from "csv-parse/sync";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function main() {
    const args = process.argv.slice(2);
    const projectSlug = args[0];
    const filePath = args[1];
    const year = args[2] || "2025";

    if (!projectSlug || !filePath) {
        console.error("Usage: npx tsx scripts/ingest-budget.ts <project-slug> <path-to-csv> [year]");
        process.exit(1);
    }

    const project = await prisma.project.findUnique({ where: { slug: projectSlug } });
    if (!project) {
        console.error(`Project not found: ${projectSlug}`);
        process.exit(1);
    }

    const fileContent = fs.readFileSync(path.resolve(filePath), "utf-8");
    const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
    });

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    console.log(`Ingesting budget for project: ${projectSlug} (${year})...`);

    let upsertCount = 0;

    for (const record of records) {
        const category = record["Account"];
        const description = record["Description"] || "No description";
        const unitCost = record["Unit Cost"] ? parseFloat(record["Unit Cost"].replace(/[$,]/g, "")) : null;
        const quantity = record["Quantity"] ? parseFloat(record["Quantity"]) : null;
        const notes = record["Notes"];

        if (!category) continue;

        for (const month of months) {
            const amountStr = record[month];
            if (!amountStr) continue;

            const amount = parseFloat(amountStr.replace(/[$,]/g, "").replace(/\((.*)\)/, "-$1")); // Handle parenthesized negatives if any
            if (isNaN(amount) || amount === 0) continue;

            const period = `${month} ${year}`;

            await prisma.budgetLine.upsert({
                where: {
                    projectId_category_description_period: {
                        projectId: project.id,
                        category,
                        description,
                        period,
                    },
                },
                update: {
                    amount,
                    unitCost,
                    quantity,
                    notes,
                },
                create: {
                    projectId: project.id,
                    category,
                    description,
                    amount,
                    unitCost,
                    quantity,
                    period,
                    notes,
                },
            });
            upsertCount++;
        }
    }

    console.log(`Successfully ingested/updated ${upsertCount} budget lines.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

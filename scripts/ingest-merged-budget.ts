import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

// Project mapping: Header Key (from files) -> Database Slug
const PROJECT_MAP: Record<string, string> = {
    "Coal Ash": "coal-ash-plant-barry",
    "Mud Dumping": "mud-dumping",
    "BCSS": "bcss-malbis-wwtp-compliance",
    "Prichard": "prichard-wastewater",
    "Oyster Keeper": "Oyster_Keeper",
    "Oyster Planting": "oyster-planting",
    "Oyster Hatchery": "oyster-hatchery",
    "Oyster Farm": "oyster_farm",
    "Oyster Monitoring": "oyster_monitoring",
    "Toxics Criteria": "toxics-criteria", // Matches "Toxics Criteria"
    "Numeric Nutrient Criteria": "numeric_nutrient_criteria",
    "Hog Bayou": "hog-bayou",
    "Dam Removal": "claiborne-millers-ferry-dam-impact-assessment",
    "Poop Policy": "poop_policy"
};

interface NarrativeRow {
    account: string;
    description: string;
    notes: string;
    quantity: number | null;
    unitCost: number | null;
}

interface RawDataRow {
    account: string;
    monthlyAmounts: number[];
}

function parseNarrativeFile(filePath: string): Record<string, NarrativeRow[]> {
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");
    const result: Record<string, NarrativeRow[]> = {};
    let currentProjectSlug: string | null = null;

    for (const line of lines) {
        if (!line.trim()) continue;

        // Check for project header
        let foundHeader = false;
        for (const [key, slug] of Object.entries(PROJECT_MAP)) {
            // Flexible matching for headers
            if (line.includes(key) && (line.includes("Project") || line === key || line.includes("Budget Narrative"))) {
                currentProjectSlug = slug;
                if (!result[currentProjectSlug]) result[currentProjectSlug] = [];
                foundHeader = true;
                break;
            }
        }
        if (foundHeader) continue;

        if (line.startsWith("Account") || line.startsWith("What")) continue;
        if (line.startsWith("\tWhat")) continue;

        const parts = line.split("\t");
        if (parts.length < 3) continue;

        const account = parts[0].trim();
        if (!account || account === "Totals" || account === "TOTAL") continue;

        const what = parts[1]?.trim();
        if (!what || what === "$-") continue;

        const explained = parts[2]?.trim();
        const unitCostStr = parts[3]?.trim();
        const quantityStr = parts[4]?.trim();
        const extraNotes = parts[7]?.trim(); // Sometimes notes are further out?

        const unitCost = unitCostStr ? parseFloat(unitCostStr.replace(/[$,]/g, "")) : null;
        const quantity = quantityStr ? parseFloat(quantityStr.replace(/[$,]/g, "")) : null;

        let notes = explained === "$-" ? "" : explained;
        if (extraNotes && extraNotes !== "$-" && extraNotes !== explained) {
            // Avoid duplication if they are same
            notes = notes ? `${notes}\n${extraNotes}` : extraNotes;
        }

        if (currentProjectSlug) {
            result[currentProjectSlug].push({
                account,
                description: what,
                notes: notes || "",
                quantity: isNaN(quantity!) ? null : quantity,
                unitCost: isNaN(unitCost!) ? null : unitCost
            });
        }
    }
    return result;
}

function parseRawDataFile(filePath: string): Record<string, RawDataRow[]> {
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");
    const result: Record<string, RawDataRow[]> = {};

    if (lines.length < 3) return result;

    const headerParts = lines[0].split("\t");
    const columnMap: Record<string, number> = {};

    console.log("Analyzing Raw Data Headers...");
    for (const [key, slug] of Object.entries(PROJECT_MAP)) {
        let index = -1;
        for (let i = 0; i < headerParts.length; i++) {
            const part = headerParts[i].trim();
            // Match key
            if ((part === key || part.includes(key)) && !part.includes("Overall") && !part.includes("Total")) {
                if (columnMap[slug] !== undefined) continue;
                index = i;
                columnMap[slug] = index;
                console.log(`Found ${slug} at column ${index} ("${part}")`);
            }
        }
    }

    // Start from line 2
    for (let i = 2; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;
        const parts = line.split("\t");

        const account = parts[0]?.trim();
        if (!account || account === "Totals" || account === "TOTAL" || account.startsWith("Date:")) continue;

        for (const [slug, startIndex] of Object.entries(columnMap)) {
            if (startIndex + 11 >= parts.length) continue;

            const months = parts.slice(startIndex, startIndex + 12).map(m => {
                const val = m ? parseFloat(m.replace(/[$,\s]/g, "").replace(/\((.*)\)/, "-$1")) : 0;
                return isNaN(val) ? 0 : val;
            });

            // Should we skip if all 0? No, let's keep them if narrative exists.

            if (!result[slug]) result[slug] = [];
            result[slug].push({
                account,
                monthlyAmounts: months
            });
        }
    }
    return result;
}

async function main() {
    const rawDataPath = path.resolve("data/import/2026-budget/raw_data.txt");
    const narrativePath = path.resolve("data/import/2026-budget/narrative_data.txt");

    console.log("Parsing files...");
    const rawData = parseRawDataFile(rawDataPath);
    const narrativeData = parseNarrativeFile(narrativePath);

    // Filter projects that have actual data
    const slugs = new Set([...Object.keys(rawData), ...Object.keys(narrativeData)]);

    for (const slug of slugs) {
        const rawRows = rawData[slug] || [];
        const narrRows = narrativeData[slug] || [];

        console.log(`\nProcessing ${slug}: RawRows=${rawRows.length}, NarrativeRows=${narrRows.length}`);

        // Find existing project in DB to get ID
        const project = await prisma.project.findFirst({ where: { slug } });
        if (!project) {
            console.warn(`Project slug not found in DB: ${slug} - Skipping`);
            continue;
        }

        // Aggregate by Account
        const allAccounts = new Set([
            ...rawRows.map(r => r.account),
            ...narrRows.map(n => n.account)
        ]);

        const budgetLinesToCreate: any[] = [];
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        for (const account of allAccounts) {
            const raw = rawRows.find(r => r.account === account);
            const narratives = narrRows.filter(n => n.account === account);

            // If no data at all, skip?
            // If raw is missing, we assume 0s
            // If narrative is missing, we use generic description?

            const monthlyAmounts = raw ? raw.monthlyAmounts : new Array(12).fill(0);

            // Check if all zero
            const total = monthlyAmounts.reduce((a, b) => a + b, 0);
            if (total === 0 && narratives.length === 0) continue;

            // Combine Descriptions
            const descriptions = [...new Set(narratives.map(n => n.description))].filter(Boolean);
            const notes = [...new Set(narratives.map(n => n.notes))].filter(Boolean);

            let finalDescription = descriptions.join("; ");
            if (!finalDescription) {
                // Try to guess name from another source? Or just use Account name if we had it?
                // But we only have Account ID.
                // We can leave it empty or "Unspecified"
                finalDescription = "Misc / Unspecified";
            }

            let finalNotes = notes.join("\n\n");

            // Add quantity/rate info to notes if useful
            const details = narratives.map(n => {
                let s = `- ${n.description}`;
                if (n.quantity || n.unitCost) {
                    s += ` (Qty: ${n.quantity || '-'}, Rate: $${n.unitCost || '-'})`;
                }
                if (n.notes) s += `: ${n.notes}`;
                return s;
            }).join("\n");

            if (narratives.length > 1) {
                finalNotes = `Details:\n${details}\n\nMerged Notes:\n${finalNotes}`;
            } else if (narratives.length === 1 && details) {
                // If only 1, maybe just use its specific format?
                // But keep it simple.
            }

            // Create 12 lines
            monthlyAmounts.forEach((amount, idx) => {
                // Only create if amount != 0 OR we have narrative?
                // Usually budget lines with 0 are noise unless they are placeholders.
                // Let's include them if total > 0.
                // Or if narr exists.
                if (amount !== 0 || narratives.length > 0) {
                    budgetLinesToCreate.push({
                        projectId: project.id,
                        category: account,
                        description: finalDescription,
                        amount,
                        unitCost: null, // Aggregated, so null
                        quantity: null, // Aggregated, so null
                        period: `${months[idx]} 2026`,
                        notes: finalNotes
                    });
                }
            });
        }

        if (budgetLinesToCreate.length > 0) {
            console.log(`Deleting existing budget lines for ${slug}...`);
            await prisma.budgetLine.deleteMany({ where: { projectId: project.id } });

            console.log(`Inserting ${budgetLinesToCreate.length} new lines...`);
            await prisma.budgetLine.createMany({ data: budgetLinesToCreate });
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());

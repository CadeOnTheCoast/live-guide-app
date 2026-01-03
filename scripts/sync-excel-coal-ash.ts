import { PrismaClient } from "@prisma/client";
import { Client } from "@microsoft/microsoft-graph-client";
import { ClientSecretCredential } from "@azure/identity";
import "isomorphic-fetch";
import path from "path";
import fs from "fs";

const prisma = new PrismaClient();

// --- Configuration ---
const TABLE_NAME = "CoalAshNarrative";
const PROJECT_SLUG = "coal-ash";

// --- Graph Client Helper ---
function getGraphClient() {
    const tenantId = process.env.AZURE_TENANT_ID;
    const clientId = process.env.AZURE_CLIENT_ID;
    const clientSecret = process.env.AZURE_CLIENT_SECRET;
    if (!tenantId || !clientId || !clientSecret) throw new Error("Missing Azure Creds");
    const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
    return Client.initWithMiddleware({
        authProvider: {
            getAccessToken: async () => {
                const token = await credential.getToken("https://graph.microsoft.com/.default");
                return token.token;
            }
        }
    });
}

// --- Helpers ---
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function parseCalendarBreakout(breakout: string): number[] {
    const clean = String(breakout || "").toLowerCase().trim();
    const distribution = Array(12).fill(0); // 0 or 1 for each month

    if (!clean || clean === "monthly") {
        return Array(12).fill(1);
    }

    if (clean.includes("q1")) { distribution[0] = 1; distribution[1] = 1; distribution[2] = 1; }
    if (clean.includes("q2")) { distribution[3] = 1; distribution[4] = 1; distribution[5] = 1; }
    if (clean.includes("q3")) { distribution[6] = 1; distribution[7] = 1; distribution[8] = 1; }
    if (clean.includes("q4")) { distribution[9] = 1; distribution[10] = 1; distribution[11] = 1; }

    MONTH_NAMES.forEach((m, idx) => {
        const full = new Date(2026, idx, 1).toLocaleString('default', { month: 'long' }).toLowerCase();
        if (clean.includes(m.toLowerCase()) || clean.includes(full)) {
            distribution[idx] = 1;
        }
    });

    if (distribution.every(v => v === 0) && clean.length > 0) {
        return Array(12).fill(1);
    }

    return distribution;
}

async function main() {
    // Load .env
    const envPath = path.resolve(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, "utf-8");
        envConfig.split("\n").forEach(line => {
            const [key, val] = line.split("=");
            if (key && val && !process.env[key]) process.env[key.trim()] = val.trim().replace(/^["']|["']$/g, "");
        });
    }
    const driveId = process.env.MS_GRAPH_DRIVE_ID;
    const itemId = process.env.MS_GRAPH_ITEM_ID;
    if (!driveId || !itemId) throw new Error("Missing Drive/Item IDs");

    const project = await prisma.project.findFirst({ where: { slug: PROJECT_SLUG } });
    if (!project) throw new Error(`Project ${PROJECT_SLUG} not found`);

    console.log(`🚀 Starting Table Sync for ${project.name}...`);
    const client = getGraphClient();

    // 1. Get Table ID (Safer than name in URL sometimes)
    console.log(`🔍 Resolving Table: ${TABLE_NAME}...`);
    const tablesReq = await client.api(`/drives/${driveId}/items/${itemId}/workbook/tables`).get();
    const table = tablesReq.value.find((t: any) => t.name === TABLE_NAME);

    if (!table) {
        throw new Error(`Table '${TABLE_NAME}' not found! Did you create it?`);
    }

    // 2. Read Data Body (No Headers)
    console.log(`📖 Reading Table Rows...`);
    const dataReq = await client.api(`/drives/${driveId}/items/${itemId}/workbook/tables/${table.id}/rows`).get();
    const rows = dataReq.value; // Array of tableRow objects, containing .values[0]

    console.log(`✅ Found ${rows.length} rows.`);

    const budgetLinesToCreate: any[] = [];
    let currentCategory = "General"; // Default

    let processedCount = 0;

    for (const rowObj of rows) {
        const row = rowObj.values[0]; // The inner array

        const colA = String(row[0] || "").trim(); // Account

        // Category Header Logic (Optional, effectively unused if we map Account->Category)
        if (colA.endsWith(":")) {
            currentCategory = colA.replace(":", "").trim();
            continue;
        }

        // Structural/Empty check
        const cost = Number(row[5]);
        if (!cost || cost === 0) continue;

        const account = colA;
        const desc = String(row[1] || "").trim(); // What
        const explained = String(row[2] || "").trim();
        const calendar = String(row[6] || "").trim();

        // --- MAPPING LOGIC START ---
        // UI "Account" Column displays the 'category' field.
        // User wants Excel Col A (Account) in that column.
        const categoryVal = account;

        // UI "Description" Column displays the 'description' field.
        // User wants Excel Col B (What) in that column.
        const descriptionVal = desc || account;

        // Notes field captures extra info
        const notesParts = [];
        if (explained) notesParts.push(explained);
        if (calendar) notesParts.push(`Calendar: ${calendar}`);
        const fullNotes = notesParts.join(" | ");
        // --- MAPPING LOGIC END ---

        const distribution = parseCalendarBreakout(calendar);
        const activeMonths = distribution.reduce((a, b) => a + b, 0);
        const monthlyAmount = activeMonths > 0 ? cost / activeMonths : 0;

        MONTH_NAMES.forEach((month, idx) => {
            if (distribution[idx] === 1) {
                budgetLinesToCreate.push({
                    projectId: project.id,
                    category: categoryVal,
                    description: descriptionVal,
                    amount: monthlyAmount,
                    period: `${month} 2026`,
                    notes: fullNotes,
                });
            } else {
                // Insert 0 for continuity
                budgetLinesToCreate.push({
                    projectId: project.id,
                    category: categoryVal,
                    description: descriptionVal,
                    amount: 0,
                    period: `${month} 2026`,
                    notes: fullNotes
                });
            }
        });
        processedCount++;
    }

    // 4. DB Sync
    if (budgetLinesToCreate.length > 0) {
        console.log(`\n[DB] Processed ${processedCount} valid source rows.`);
        console.log(`[DB] Generated ${budgetLinesToCreate.length} monthly entries.`);

        // Delete OLD Excel data (Keeping Staffing safe)
        console.log(`[DB] Deleting old 'General' records for ${project.slug}...`);
        await prisma.budgetLine.deleteMany({
            where: {
                projectId: project.id,
                category: { not: "Staffing" }
            }
        });

        console.log(`[DB] Inserting new records...`);
        const result = await prisma.budgetLine.createMany({ data: budgetLinesToCreate });
        console.log(`[Success] Inserted ${result.count} records.`);
    } else {
        console.log("No valid budget lines found in the table.");
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

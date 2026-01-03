import { Client } from "@microsoft/microsoft-graph-client";
import { ClientSecretCredential } from "@azure/identity";
import "isomorphic-fetch";
import path from "path";
import fs from "fs";

// --- Configuration ---
const TABLE_NAME = "CoalAshNarrative";

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

    const client = getGraphClient();
    console.log(`🔍 Verifying Mapping for Table: ${TABLE_NAME}...`);

    // 1. Get Table ID
    const tablesReq = await client.api(`/drives/${driveId}/items/${itemId}/workbook/tables`).get();
    const table = tablesReq.value.find((t: any) => t.name === TABLE_NAME);

    if (!table) {
        console.error(`❌ Table '${TABLE_NAME}' not found!`);
        return;
    }

    // 2. Read Rows
    const dataReq = await client.api(`/drives/${driveId}/items/${itemId}/workbook/tables/${table.id}/rows`).get();
    const rows = dataReq.value;

    console.log(`\nFound ${rows.length} rows. showing DRY RUN mapping:\n`);

    let currentCategory = "General";

    // Print Header
    console.log(
        "ROW | " +
        "RAW COL A (Account)".padEnd(30) + " | " +
        "RAW COL B (What)".padEnd(30) + " | " +
        "RAW COL C (Explained)".padEnd(30) + " | " +
        "-> MAPPED CATEGORY".padEnd(30) + " | " +
        "-> MAPPED DESC".padEnd(40) + " | " +
        "-> MAPPED NOTES (Expandable)"
    );
    console.log("-".repeat(220));

    let count = 0;
    for (const rowObj of rows) {
        const row = rowObj.values[0];

        const colA = String(row[0] || "").trim(); // Account
        const colB = String(row[1] || "").trim(); // What
        const colC = String(row[2] || "").trim(); // Explained

        // Category Logic
        if (colA.endsWith(":")) {
            currentCategory = colA.replace(":", "").trim();
            console.log(`--- SECTION HEADER DETECTED: ${currentCategory} ---`);
            continue;
        }

        // Skip empty cost lines for clarity (or show them if user wants to see everything)
        // User just wants to see mapping of fields. Let's show rows that look like line items.
        // If Col A starts with a number (like 4040) it's likely a line item.
        const looksLikeLineItem = /^\d/.test(colA);

        if (looksLikeLineItem) {
            const mappedDesc = colB ? `${colA} - ${colB}` : colA;
            // Notes will contain Explained + Calendar
            const mappedNotes = colC;

            console.log(
                String(count + 1).padEnd(3) + " | " +
                colA.substring(0, 28).padEnd(30) + " | " +
                colB.substring(0, 28).padEnd(30) + " | " +
                colC.substring(0, 28).padEnd(30) + " | " +
                currentCategory.substring(0, 28).padEnd(30) + " | " +
                mappedDesc.substring(0, 38).padEnd(40) + " | " +
                mappedNotes.substring(0, 30)
            );
            count++;
        }
    }
}

main();

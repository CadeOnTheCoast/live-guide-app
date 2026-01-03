import { Client } from "@microsoft/microsoft-graph-client";
import { ClientSecretCredential } from "@azure/identity";
import "isomorphic-fetch";
import path from "path";

// Inline Client
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
    // Load Env
    const fs = await import("fs");
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

    if (!driveId || !itemId) {
        console.error("Missing IDs in .env");
        return;
    }

    const client = getGraphClient();
    console.log("🔍 Fetching Tables...");

    try {
        const tablesReq = await client.api(`/drives/${driveId}/items/${itemId}/workbook/tables`).get();
        const tables = tablesReq.value;

        if (tables.length === 0) {
            console.log("No tables found.");
        } else {
            console.log(`Found ${tables.length} Tables:`);
            console.table(tables.map((t: any) => ({
                Name: t.name,
                ID: t.id,
                "Show Headers": t.showHeaders
            })));

            // Specifically check CoalAshNarrative headers
            const targetTable = tables.find((t: any) => t.name === "CoalAshNarrative");
            if (targetTable) {
                console.log("\n🔍 Inspecting 'CoalAshNarrative' Headers...");
                const headerReq = await client.api(`/drives/${driveId}/items/${itemId}/workbook/tables/${targetTable.id}/headerRowRange`).get();
                console.log("Headers:", headerReq.values[0]);
            }
        }

    } catch (e: any) {
        console.error("Error:", e.message);
    }
}

main();

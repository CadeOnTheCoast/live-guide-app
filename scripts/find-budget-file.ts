import { Client } from "@microsoft/microsoft-graph-client";
import { ClientSecretCredential } from "@azure/identity";
import "isomorphic-fetch";
import fs from "fs";
import path from "path";

// Manually load .env
const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, "utf-8");
    envConfig.split("\n").forEach(line => {
        const [key, val] = line.split("=");
        if (key && val && !process.env[key]) {
            process.env[key.trim()] = val.trim().replace(/^["']|["']$/g, "");
        }
    });
}

const tenantId = process.env.AZURE_TENANT_ID;
const clientId = process.env.AZURE_CLIENT_ID;
const clientSecret = process.env.AZURE_CLIENT_SECRET;

async function main() {
    console.log("🔍 Searching for '2026 Budget.xlsx'...");

    if (!tenantId || !clientId || !clientSecret) {
        console.error("❌ Missing Azure Credentials in .env");
        process.exit(1);
    }

    const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
    const client = Client.initWithMiddleware({
        authProvider: {
            getAccessToken: async () => {
                const token = await credential.getToken("https://graph.microsoft.com/.default");
                return token.token;
            }
        }
    });

    try {
        // 1. Find Site
        const siteName = "Team Mobile Baykeeper";
        const sites = await client.api(`/sites?search=${siteName}`).get();
        if (sites.value.length === 0) {
            console.error(`❌ Site '${siteName}' not found.`);
            return;
        }
        const site = sites.value[0];
        console.log(`✅ Site: ${site.displayName}`);

        // 2. Drive
        const drive = await client.api(`/sites/${site.id}/drive`).get();
        console.log(`✅ Drive: ${drive.name} (ID: ${drive.id})`);

        // 3. Search
        const fileName = "2026 Budget.xlsx";
        const searchRes = await client.api(`/drives/${drive.id}/root/search(q='${fileName}')`).get();

        // Filter strictly
        const matches = searchRes.value.filter((f: any) =>
            f.name.toLowerCase() === fileName.toLowerCase() ||
            f.name.toLowerCase().includes("2026 budget")
        );

        console.log(`\nFound ${matches.length} matches:`);
        matches.forEach((f: any) => {
            console.log("---------------------------------------------------");
            console.log(`Name:      ${f.name}`);
            console.log(`Drive ID:  ${f.parentReference.driveId}`);
            console.log(`Item ID:   ${f.id}`);
            console.log(`Web URL:   ${f.webUrl}`);
        });

        if (matches.length > 0) {
            console.log("---------------------------------------------------");
            console.log("✅ Copy the Drive ID and Item ID for your .env");
        } else {
            console.log("❌ No exact matches found.");
        }

    } catch (error: any) {
        console.error("❌ Error:", error.message);
    }
}

main();

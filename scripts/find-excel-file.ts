import { Client } from "@microsoft/microsoft-graph-client";
import { ClientSecretCredential } from "@azure/identity";
import "isomorphic-fetch";
import fs from "fs";
import path from "path";
import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";

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
    const argv = await yargs(hideBin(process.argv))
        .option("name", { type: "string", demandOption: true, description: "Partial filename to search for" })
        .option("site", { type: "string", description: "Site Name to search in (e.g. 'Team Mobile')" })
        .help()
        .argv;

    const { name, site: siteName } = argv;

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
        let siteId = "root";
        let siteDisplayName = "Root (Communication Site)";
        let siteUrl = "";

        // 1. Resolve Site (if provided)
        if (siteName) {
            console.log(`🔍 Resolving Site: "${siteName}"...`);
            const sites = await client.api(`/sites?search=${siteName}`).get();

            if (sites.value.length === 0) {
                console.error(`❌ No sites found matching "${siteName}"`);
                process.exit(1);
            }

            // Prefer exact match if possible, otherwise take first
            // Just take the first one for now
            const match = sites.value[0];
            siteId = match.id;
            siteDisplayName = match.displayName;
            siteUrl = match.webUrl;
            console.log(`✅ Target Site: ${siteDisplayName} (${siteUrl})`);
        } else {
            console.log(`🔍 Searching in Root Site...`);
        }

        // 2. Get Default Drive
        // Sometimes sites have multiple drives. We assume the default one.
        const drive = await client.api(`/sites/${siteId}/drive`).get();
        console.log(`Target Drive: ${drive.name} (ID: ${drive.id})`);

        // 3. Search for File
        console.log(`🔍 Searching for file "${name}"...`);
        const searchRes = await client.api(`/drives/${drive.id}/root/search(q='${name}')`).get();

        const files = searchRes.value.filter((f: any) => f.file);

        if (files.length === 0) {
            console.log("No files found matching that name.");
        } else {
            console.log(`\nFound ${files.length} matches:`);
            console.table(files.map((f: any) => ({
                Name: f.name,
                "Drive ID": f.parentReference.driveId,
                "Item ID": f.id,
                URL: f.webUrl
            })));
            console.log("\nCopy the 'Drive ID' and 'Item ID' for the config.");
        }

    } catch (error: any) {
        console.error("\n❌ Error searching:");
        console.error(error.message);
        if (error.statusCode === 404) {
            console.error("Site or Drive not found. Ensure the App has 'Sites.Read.All' permissions.");
        }
    }
}

main();

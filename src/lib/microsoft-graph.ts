import { Client } from "@microsoft/microsoft-graph-client";
import { ClientSecretCredential } from "@azure/identity";
import "isomorphic-fetch";

// Config (ensure these are in .env)
const tenantId = process.env.AZURE_TENANT_ID;
const clientId = process.env.AZURE_CLIENT_ID;
const clientSecret = process.env.AZURE_CLIENT_SECRET;

// Function to get an authenticated Graph Client
export function getGraphClient() {
    if (!tenantId || !clientId || !clientSecret) {
        throw new Error("Azure credentials not fully configured in .env");
    }

    const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);

    // Initialize Graph Client with Azure Identity Auth
    const client = Client.initWithMiddleware({
        authProvider: {
            getAccessToken: async () => {
                const token = await credential.getToken("https://graph.microsoft.com/.default");
                return token.token;
            }
        }
    });

    return client;
}

// Example Helper: Read Excel File (Drive Item)
export async function getExcelWorkbook(driveId: string, itemId: string) {
    const client = getGraphClient();
    return await client
        .api(`/drives/${driveId}/items/${itemId}/workbook/worksheets`)
        .get();
}

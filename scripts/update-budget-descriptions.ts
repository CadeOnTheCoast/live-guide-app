import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

// Map project headers in text to slugs
const PROJECT_MAP: Record<string, string> = {
    "Coal Ash": "coal_ash",
    "Mud Dumping": "mud_dumping",
    "BCSS": "bcss", // Assuming simple match
    "BCSS Project": "bcss",
    "Prichard": "prichard",
    "Prichard Project": "prichard",
    "Oyster Keeper": "oyster_keeper",
    "Oyster Planting": "oyster_planting",
    "Oyster Planting Project": "oyster_planting",
    "Oyster Hatchery": "oyster_hatchery",
    "Oyster Hatchery Project": "oyster_hatchery",
    "Oyster Farm": "oyster_farm",
    "Oyster Farm Project": "oyster_farm",
    "Oyster Monitoring": "oyster_monitoring",
    "Oyster Monitoring Project": "oyster_monitoring",
    "Toxics Criteria": "toxics_criteria",
    "Nutrient Criteria": "numeric_nutrient_criteria", // Best guess
    "Hog Bayou": "hog_bayou",
    "Dam Removal": "dam_removal"
};

async function main() {
    const filePath = path.resolve("data/import/2026-budget/narrative_data.txt");
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");

    let currentProjectSlug: string | null = null;
    let currentCategory: string | null = null;

    console.log("Starting description update...");

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Check for Project Header
        // Heuristic: Line ends with "Project" or is in our map keys
        let foundProject = false;
        for (const key of Object.keys(PROJECT_MAP)) {
            if (line.toLowerCase().includes(key.toLowerCase()) && (line.includes("Project") || line.includes("Budget Narrative") || line === key)) {
                currentProjectSlug = PROJECT_MAP[key];
                console.log(`\nSwitched to project: ${currentProjectSlug}`);
                foundProject = true;
                break;
            }
        }
        if (foundProject) continue;

        // Skip header rows
        if (line.startsWith("Account") || line.startsWith("What")) continue;

        // Header categories (e.g., "Communications: ...")
        if (line.endsWith("Marketing") || line.endsWith("Equipment") || line.endsWith("Culture") || line.endsWith("Engagement") || line.endsWith("Investigation") || line === "Programs: Projects" || line === "Meals") {
            // These are just headers in the text, usually not the lines themselves unless indented.
            // But the text structure is tab separated. Let's parse columns.
        }

        const parts = line.split("\t").map(p => p.trim());

        // We expect: [Account, What, Explained, ...]
        // Sometimes Account is empty if it's a continuation? No, looks like row-based.

        // Check if it's a valid data row
        // It should have an Account (starting with number or Text) and "What" text
        if (parts.length < 3) continue;

        const account = parts[0];
        const what = parts[1];
        const explained = parts[2];
        const existingNotes = parts[7] || ""; // Column H is Notes in the spread sheet structure

        // Skip total lines
        if (account === "Totals" || account === "TOTAL") continue;

        // Skip empty lines disguised as data
        if (!account && !what) continue;

        // If we have a project and an account, try to find and update
        if (currentProjectSlug && account) {

            // Clean up account
            const category = account;

            // Clean up description (What)
            // If "What" is empty, maybe use Account name? No, user said "What" is summary.
            // If "What" is "-", it means no budget?
            // "$-" usually in cost columns.
            // Let's assume if "What" is empty or "-", we verify if it's a line we care about.
            if (!what || what === "$-") continue;

            const description = what;
            let notes = explained;

            if (notes === "$-" || !notes) notes = "";

            // Combine Explained with existing Notes if useful? 
            // The file has "Notes" in column H.
            // User said: "Explained" this is our detailed explanation (Column C).
            // Let's use Explained as the primary source for 'notes' field in DB.
            // If there are other notes in col H, maybe append?
            if (parts[7] && parts[7] !== "$-") {
                notes = notes ? `${notes}\n\nNote: ${parts[7]}` : parts[7];
            }

            // Find matching lines in DB
            // We need to match by Project and Category (Account). 
            // The problem is there might be multiple lines for the same Account in DB if we imported them that way? 
            // Previous import used Account as Description.
            // So we search for lines where category = account OR description = account (since we set description=account previously)

            // Wait, previous import loop:
            // const category = record["Account"];
            // const description = record["Description"] || "No description";
            // ... upsert ...

            // In the raw data previously, Account and Description were identical. 
            // So we should find lines where projectId = slug AND category = account.

            // One complication: One Account might have multiple "What" lines in this new file?
            // Example from text:
            // 7455 Travel    Local/regional ...
            // 7455 Travel    Montgomery ...
            // 7455 Travel    Airfare ...

            // In the DB, we keyed by (projectId, category, description, period).
            // If the DB currently has only one line per Account (because Description was same as Account),
            // then updating it simply by Account will overwrite multiple times if there are multiple "What" lines for the same Account.
            // This implies we essentially need to DELETE existing budget lines for this project and RE-INGEST with these new descriptions?
            // OR, the previous import created rows based on the *columns* of monthly data.
            // If the previous raw_data.txt had multiple rows for "7455 Travel" but with same description, they would have merged or overwritten each other unless the parser handled it?

            // Let's look at the previous raw_data.txt.
            // "7455 Travel" appeared multiple times with different numbers.
            // If description was same, they would clash on unique key (projectId, category, description, period).
            // Unique constraint: @@unique([projectId, category, description, period])
            // So if we had multiple "7455 Travel" lines in previous file, only the LAST one would survive for each month.
            // THAT EXPLAINS why we might be missing data if valid rows were overwritten.

            // BUT, the goal now is to fix the descriptions.
            // If I just update, I can't split one DB row into multiple.
            // I should really DELETE the old lines for these projects and RE-INGEST properly.
            // But I don't have the monthly numbers in this text file easily parsed (it has broken out "Calendar Breakout" text, not monthly columns).

            // Wait, look at the text file again.
            // "Cost" column exists. "Calendar Breakout" says "Q1 & Q2" or "Monthly".
            // It DOES NOT have the monthly spread.
            // So I cannot re-ingest strictly from this file.
            // I must rely on the PREVIOUS raw_data.txt for numbers.

            // CRITICAL INSIGHT:
            // The previous raw_data.txt had rows with "Account" and "Description" columns that were identical.
            // IT ALSO had multiple rows for the same Account.
            // Example:
            // 7455 Travel  $2073 ...
            // 7455 Travel  $1360 ...
            // 7455 Travel  $680 ...
            // Since "Description" was same as "Account", my previous ingest likely kept overwriting or merging them incorrectly?
            // Wait, `ingest-budget.ts` upserts.
            // `where: { projectId_category_description_period: ... }`
            // If Description == Account for all of them, then for "Jan 2026", we upsert keys (id, "7455", "7455", "Jan 2026").
            // The second row comes in, same keys -> UPDATE.
            // So we LOST data. We only have the last row's values.

            // To fix this correctly:
            // I need to map the rows in `raw_data.txt` (which has the numbers) to the rows in `narrative_data.txt` (which has the descriptions).
            // They seem to be in the same order?
            // Let's verify.

            // Narrative:
            // 7455 Travel (Meetings with electeds)
            // 7455 Travel (Airfare)
            // 7455 Travel (Car)
            // 7455 Travel (Hotel)
            // ...

            // Raw Data (tail output I saw earlier):
            // 7455 Travel (row 1 values)
            // 7455 Travel (row 2 values)
            // 7455 Travel (row 3 values)

            // YES. They correspond line-by-line within the project block.
            // So I need a script that:
            // 1. Reads `raw_data.txt` (Numbers) AND `narrative_data.txt` (Descriptions) in parallel? 
            // OR
            // 2. Just enhances `parse-budget-v2.ts` (or a new parsing script) to read `raw_data.txt` (which seemed to contain the narrative text in the block below the numbers? No, the `grep` failed earlier).

            // WAIT. The grep failed earlier. But looking at the `tail` output of `raw_data.txt` in step 721:
            // It shows lines like:
            // 7455 Travel $2,073 ...
            // 7455 Travel $1,360 ...
            // It DOES NOT show the narrative text "Meetings with electeds".

            // So `raw_data.txt` ONLY has numbers and repeated Account names.
            // `narrative_data.txt` has Account names and Unique Descriptions.

            // HYPOTHESIS: The rows in both files align 1:1.
            // IF they align 1:1, I can:
            // 1. Parse `raw_data.txt` to get [Account, Numbers...] list.
            // 2. Parse `narrative_data.txt` to get [Account, Description, Notes...] list.
            // 3. Merge them by index.
            // 4. Ingest.

            // Verification of Alignment:
            // Narrative for Coal Ash 7455 Travel has ~6 entries.
            // Raw Data for Coal Ash 7455 Travel (from tail) shows multiple lines. 
            // "Travel $2,073...", "Travel $1,360...", "Travel $680...", "Travel $0...", "Travel $30...", "Travel $4...", "Travel $227...".
            // Counts:
            // Narrative 7455:
            // 1. Meetings with electeds
            // 2. Airfare
            // 3. Car
            // 4. Hotel
            // 5. Mileage
            // 6. Parking
            // (Meals are 7460)

            // Raw Data 7455 (checking tail output again, Step 712):
            // 1. $2,073... (Total line?) No.
            // 2. $1,360...
            // 3. $680...
            // 4. $- ...
            // 5. $30 ...
            // 6. $4 ...
            // 7. $227 ...
            // That's 7 rows?
            // Narrative had 6 rows? 
            // Narrative 7456 Travel (Mileage) - wait, typo in narrative "7456"?
            // "7456 Travel Mileage (Montgomery electeds)"
            // "7455 Travel Parking (Montgomery)"
            // So 6 lines of "Travel" related things.

            // The raw file has 7 lines of 7455.
            // One might be a sub-header or blank?
            // I need to be very careful.

            // Alternative Strategy:
            // Matches strictly by "Unit Cost" or "Total Cost" if available?
            // Narrative has "Cost" column (Column F).
            // Raw Data has "Totals" column (Column N - "Dec" is M, so N is Total?).
            // Let's check `mud_dumping.csv` header: "Jan"..."Dec","Notes". No total.
            // But `raw_data.txt` has a column after Dec.

            // Let's try to match by Account + Cost/Amounts?
            // Narrative has "Cost" (Annual Total?).
            // Raw Data has monthly values. Sum them to get annual.
            // If matches, map the description.

            // This is safer.
            // I will write a script that:
            // 1. Parses `narrative_data.txt` into a lookup: `Map<Project, Array<{Account, Description, Notes, TotalCost}>>`.
            // 2. Parses `raw_data.txt` into `Map<Project, Array<{Account, MonthlyData[], ParsedTotal}>>`.
            // 3. Iterates through the raw data rows. For each row, tries to find a matching entry in the Narrative list for that Project+Account, consuming it (so duplicates are handled in order).
            // 4. If strict match on Total Cost isn't possible (rounding errors), try order-based fallback?
            //    Or just assume order is preserved? The user likely pasted from the same spreadsheet.
            //    Assumption: Order is preserved.

            // Refined Plan:
            // 1. Create `scripts/ingest-merged-budget.ts`.
            // 2. Read `narrative_data.txt` -> structured list per project.
            // 3. Read `raw_data.txt` -> structured list per project.
            // 4. Zip them together.
            // 5. Ingest to DB.

            // This requires deleting old budget lines first to avoid ghosts.
            // `prisma.budgetLine.deleteMany({ where: { project: { slug: ... } } })`

        }
    }
}

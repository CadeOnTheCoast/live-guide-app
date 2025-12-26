# [Review] Database Resilience & Professional Processes Plan

This is a review of the proposed plan to harden the Live Guide database and engineering workflows.

## Overall Assessment
The plan is **excellent and follows industry best practices** for scaleable, resilient web applications. It addresses the most common sources of "agent-induced" or developer-induced data loss: environment confusion, destructive commands, and lack of audit trails.

---

## 1. Environments (Dev, Staging, Prod)
**Feedback:** Fully support this.
- **Current State:** The project seems to have a single `.env` approach.
- **Recommendation:** Use **Supabase Projects** for staging and prod. For local dev, using **Docker Postgres** or a local Supabase CLI instance is best.
- **Tip:** Ensure `NODE_ENV` is correctly set in each environment to enable/disable certain safety guards.

## 2. Migrations-Only Workflow
**Feedback:** This is the most critical change for stability.
- **Current State:** You have a `migrations` folder, but `prisma:migrate` currently points to `migrate dev`.
- **Refinement:** 
    - `npm run db:migrate:dev` -> `prisma migrate dev` (only for local).
    - `npm run db:migrate:deploy` -> `prisma migrate deploy` (for CI/CD).
- **Destructive Warning:** `prisma migrate dev` can trigger a reset if it detects drift. The guardrail in Section 5 is essential here.

## 3. Reference vs. Content Data
**Feedback:** Smart distinction.
- **Seeding:** Your current `seed.ts` is already idempotent (`upsert`), which is perfect. 
- **Expansion:** Adding canonical departments (F&R, CE, GA, COMMS, PM) directly into the seed file is the right move.
- **Archiving placeholders:** Instead of deleting them in the seed (which might fail if there are relations), consider marking them `isActive: false` or similar if the schema allows.

## 4. Export / Import "Escape Hatch"
**Feedback:** This is the ultimate safety net.
- **Implementation Detail:** When exporting to JSON/CSV, ensure you use **Slugs** or **External IDs** rather than database `cuid`s where possible, to make imports across environments smoother.
- **Merge Logic:** The `POST /admin/import` will need a clear strategy for handling conflicts (e.g., "overwrite" vs "skip").

## 5. Destructive Command Guardrails
**Feedback:** Highly recommended for agentic workflows.
- **Implementation:** You can wrap Prisma commands in a simple Node script that checks `process.env.ALLOW_DESTRUCTIVE_DB`.
- **Example:**
    ```bash
    # scripts/db-migrate.sh
    if [[ "$*" == *"reset"* && "$ALLOW_DESTRUCTIVE_DB" != "YES_I_KNOW" ]]; then
      echo "Error: Periodic destructive action blocked."
      exit 1
    fi
    npx prisma "$@"
    ```

## 6. Audit Logging
**Feedback:** Essential for "Who changed what?"
- **Schema Suggestion:** 
    ```prisma
    model AuditLog {
      id          String   @id @default(cuid())
      actorEmail  String
      action      String   // "CREATE", "UPDATE", "DELETE"
      entityType  String   // "Project", "KeyResult"
      entityId    String
      before      Json?
      after       Json?
      createdAt   DateTime @default(now())
    }
    ```
- **Performance:** For high-volume writes, consider using a background task or Supabase's built-in audit capabilities if available, but an `AuditLog` table is a great starting point.

## 7. CI/CD (GitHub Actions)
**Feedback:** Total non-negotiable for professional teams.
- **Smoke Test:** Running `migrate deploy` against a temporary Postgres container in CI catches 90% of PR-breaking database changes.

---

## Suggested Priority
1. **Guardrails & Migration Discipline:** Stop using `db push` and implement the safety scripts.
2. **Canonical Seeding:** Formalize the departments and core data.
3. **CI Integration:** Set up the GitHub Action to validate migrations.
4. **Audit Log:** Start tracking changes.
5. **Export/Import:** Build the "escape hatch" once the schema is more stable.

## Hosting Verdict
**Vercel + Supabase** is the clear winner here. It handles the Preview/Production env separation natively with environment variable overrides.

> [!IMPORTANT]
> **Next Step:** If you approve, I can start by creating the safety scripts and updating the `package.json` with the new environment-aware commands.

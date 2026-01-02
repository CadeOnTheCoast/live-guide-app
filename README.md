# Live Guide App

A Next.js + Prisma + Postgres dashboard for Mobile Baykeeper projects. The app uses Tailwind CSS and shadcn/ui for styling and ships with Vitest for tests.

## Quick start

1. Install dependencies
   ```bash
   npm install
   ```
2. Copy environment variables and set `DATABASE_URL` for Postgres
   ```bash
   cp .env.example .env
   # edit .env with your credentials
   ```
3. Generate Prisma client and apply migrations
   ```bash
   npx prisma migrate dev
   ```
4. Seed the database
   ```bash
   npm run prisma:seed
   ```
5. (Internal) Ingest or populate data
   ```bash
   # Import from project template markdown
   # npx tsx scripts/ingest-project.ts path/to/project-template.md

   # Or run the standard dashboard data importer
   npm run import:data
   ```
6. Run the development server
   ```bash
   npm run dev
   ```
6. Open http://localhost:3000 to view the landing page listing projects.
7. Admin tools live under `/admin` and require a signed-in Person with the `ADMIN` role.

## Scripts
- `npm run dev` – start the Next.js dev server
- `npm run build` – build for production
- `npm run start` – start production server
- `npm run lint` – run ESLint
- `npm run typecheck` – run TypeScript checks with `tsc --noEmit`
- `npm run test` – run Vitest unit and component tests
- `npm run prisma:migrate` – run `prisma migrate dev`
- `npm run prisma:generate` – generate Prisma client
- `npm run prisma:seed` – seed Departments, People, and Projects

### Data Import Scripts
- `npm run import:data` – standard dashboard data importer (uses `scripts/import-dashboard-data.ts`)
- `npx tsx scripts/ingest-project.ts` – ingest project data from a Markdown template

> [!NOTE]
> One-time utility scripts and historical fixes are archived in `scripts/archive/`.

Database-aware tests are skipped unless `DATABASE_URL` is set and the database has been migrated/seeded.

## Roadmap
See [ROADMAP.md](file:///Users/cade/Documents/Repos/live-guide-app/ROADMAP.md) for planned features and historical milestones.

## Project structure
- `src/app` – Next.js App Router pages and layout
- `src/components` – shared UI, including `src/components/ui` from shadcn/ui
- `src/lib` – helpers such as `cn`
- `src/server` – Prisma client
- `prisma` – Prisma schema and seed script
- `tests` – Vitest unit/component tests

## Server actions conventions
- Place `"use server";` at the top of dedicated server action modules.
- Export initial form state values as constants (not functions) and reuse them with `useFormState`.
- Avoid inline `"use server"` directives inside functions or exporting synchronous functions from server action modules.

## Auth & Supabase setup

The app uses Supabase magic-link authentication restricted to Mobile Baykeeper email domains.

1. Create a Supabase project at https://supabase.com/ and copy the project URL and anon key.
2. Configure environment variables (see `.env.example`):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` (defaults to `http://localhost:3000` for dev)
   - `ALLOWED_EMAIL_DOMAINS` (comma-separated list like `mobilebaykeeper.org`)
3. In the Supabase dashboard, set **Site URL** to `http://localhost:3000` (or your deployed URL) and add `http://localhost:3000/auth/callback` to **Redirect URLs**.
4. Start the dev server and open `/login` to request a magic link. Only emails from allowed domains can sign in. The link returns to `/auth/callback`, exchanges the code for a session, then redirects to `/projects` (or the `next` query param).
5. The `/projects` and `/admin` areas are authenticated; anonymous visitors are redirected to `/login` with a `next` parameter so they can return after signing in.

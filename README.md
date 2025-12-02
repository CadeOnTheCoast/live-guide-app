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
5. Run the development server
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

Database-aware tests are skipped unless `DATABASE_URL` is set and the database has been migrated/seeded.

## Project structure
- `src/app` – Next.js App Router pages and layout
- `src/components` – shared UI, including `src/components/ui` from shadcn/ui
- `src/lib` – helpers such as `cn`
- `src/server` – Prisma client
- `prisma` – Prisma schema and seed script
- `tests` – Vitest unit/component tests

## Auth & Supabase setup

The app uses Supabase magic-link authentication restricted to Mobile Baykeeper email domains.

1. Create a Supabase project at https://supabase.com/ and copy the project URL and anon key.
2. Configure environment variables (see `.env.example`):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `ALLOWED_EMAIL_DOMAINS` (comma-separated list like `mobilebaykeeper.org`)
3. Start the dev server and open `/login` to request a magic link. Only emails from allowed domains can sign in.
4. The `/projects` area is authenticated; anonymous visitors are redirected to `/login`.

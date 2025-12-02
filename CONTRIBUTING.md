# Contributing

## Folder structure
- `src/app` – App Router routes, including `layout.tsx` and the landing page `page.tsx`
- `src/components` – shared UI components; shadcn/ui primitives live in `src/components/ui`
- `src/lib` – shared utilities (e.g., `cn`)
- `src/server` – server helpers such as the Prisma client in `db.ts`
- `prisma` – Prisma schema and seed script
- `tests` – Vitest unit and component tests

Shared UI controls follow the shadcn style in `src/components/ui` (e.g., `Button`, `Input`, `Select`). Admin forms also reuse
helpers in `src/components/admin` like `SharedCheckbox` and `SharedTextarea`.

## Development workflow
1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env` and set `DATABASE_URL` for your Postgres instance.
3. Add Supabase credentials to `.env` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) and set `ALLOWED_EMAIL_DOMAINS` for the login domain restrictions.
3. Apply migrations and generate the client: `npx prisma migrate dev`.
4. Seed baseline data: `npm run prisma:seed`.
5. Start the dev server with `npm run dev` and open `http://localhost:3000`.
6. Run checks before opening a PR:
   - `npm run lint`
   - `npm run typecheck`
   - `npm run test`

## Prisma schema expectations
- `prisma/schema.prisma` contains the canonical Live Guide schema. Do not modify models, fields, enums, or relations without explicit product/architecture approval.
- Any schema changes must go through review and be reflected in migrations and seeds.

## Roles
- People have a `role` (`ADMIN`, `EDITOR`, `VIEWER`) set in the database/seed for now.
- Permission helpers live in `src/server/permissions.ts`.

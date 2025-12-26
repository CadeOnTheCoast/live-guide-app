# Deployment Runbook: Vercel + Supabase

Follow these steps to ensure a successful deployment and database synchronization for the Live Guide application.

## 1. Required Environment Variables

Ensure the following environment variables are set in your Vercel Project Settings (Preview and Production):

| Variable | Description | Example / Note |
| :--- | :--- | :--- |
| `DATABASE_URL` | Connection string for the application. | Use the pooled URL if using PgBouncer. Add `?pgbouncer=true&statement_cache_size=0` if needed. |
| `DIRECT_DATABASE_URL` | Direct connection string for Prisma migrations. | Use the non-pooled, direct PostgreSQL URL from Supabase. |
| `NEXT_PUBLIC_SUPABASE_URL` | URL for Supabase client. | Found in Supabase project settings. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anonymous key for Supabase client. | Found in Supabase project settings. |

## 2. Database Migrations

To apply missing schema changes (like `isActive` or `AuditLog`) to your Supabase database:

1.  **Direct Migration**: Use the `DIRECT_DATABASE_URL` in your local environment or CI.
2.  **Safety**: Always use `prisma migrate deploy` to apply existing migrations without resetting the database.
    ```bash
    npx prisma migrate deploy
    ```
    > [!CAUTION]
    > Never run `prisma migrate reset` in an environment with real data.

## 3. Build Parity

The application must be built using Node.js runtime. Ensure no Edge runtime declarations are used in routes that import Prisma.

To verify build locally:
```bash
npm install
npx prisma generate
npm run build
```

## 4. Troubleshooting

- **db is undefined**: Ensure `DATABASE_URL` is set. The Prisma client in `src/server/db.ts` uses a global cache pattern.
- **Module not found (zod)**: Ensure `zod` is listed in `dependencies` in `package.json` (fixed in v0.1.0).
- **Project table does not exist**: This usually means the migration history is out of sync. Use `npx prisma migrate resolve --applied <migration_name>` ONLY if you are sure the migration has been manually applied to the DB.

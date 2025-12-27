# Vercel & Supabase Deployment Guide

This document outlines the required environment variables and steps to deploy the Live Guide application successfully.

## Required Environment Variables

Set these in your Vercel Project Settings (Environment Variables):

| Key | Value / Example | Notes |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgresql://user:pass@host:5432/db?pgbouncer=true&statement_cache_size=0` | The pooler connection string. |
| `DIRECT_DATABASE_URL` | `postgresql://user:pass@host:5432/db` | Direct connection string (no pooler). Required for migrations. |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project.supabase.co` | |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `your-anon-key` | |

## Deployment Checklist

1. **Database Migrations**:
   Run the following command locally or via a CI pipeline to apply migrations to production:
   ```bash
   npx prisma migrate deploy
   ```
   > [!IMPORTANT]
   > Ensure `DIRECT_DATABASE_URL` is set in your local environment when running this.

2. **Vercel Runtime**:
   The application is configured to run on the **Node.js** runtime. Edge runtime is not compatible with Prisma at this time.

3. **Prisma Generation**:
   The Vercel build process will automatically run `prisma generate` if the `@prisma/client` dependency is present.

## Troubleshooting

- **500 Errors (db undefined)**: Ensure `DATABASE_URL` is correctly set and that the Prisma client is initialized using the singleton pattern in `src/server/db.ts`.
- **Missing Module 'zod'**: Ensure `zod` is listed in the `dependencies` section of `package.json`, not `devDependencies`.
- **Schema Mismatches**: If you see errors about missing columns (like `isActive`), run `npx prisma migrate deploy`.

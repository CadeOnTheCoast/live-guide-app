# Agent instructions

- Supabase magic-link auth uses `/auth/callback` to exchange the code for a session via `createSupabaseRouteHandlerClient` in `src/lib/supabase/server.ts`. Reuse these helpers for future auth changes.
- Redirect targets can be adjusted with the `next` query param used by `/login` and `/auth/callback`; defaults live in `buildEmailRedirectTo` in `src/app/login/page.tsx`.
- Follow existing Supabase client helpers in `src/lib/supabase` instead of introducing new auth libraries.
- Server action modules should start with `"use server";`, export initial state objects as constants, and avoid inline `"use server"` annotations inside functions.
- Avoid rendering `<form>` elements directly inside `<tbody>` or other table elements that restrict children, as this causes hydration mismatches. Use the HTML `form` attribute on inputs instead.
- One-time utility scripts should be placed in `scripts/archive/` after use to maintain a clean root `scripts/` directory.
- Always use the Supabase helpers in `src/lib/supabase` for consistent auth handling across server and route handlers.

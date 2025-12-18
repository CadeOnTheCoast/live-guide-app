# Agent instructions

- Supabase magic-link auth uses `/auth/callback` to exchange the code for a session via `createSupabaseRouteHandlerClient` in `src/lib/supabase/server.ts`. Reuse these helpers for future auth changes.
- Redirect targets can be adjusted with the `next` query param used by `/login` and `/auth/callback`; defaults live in `buildEmailRedirectTo` in `src/app/login/page.tsx`.
- Follow existing Supabase client helpers in `src/lib/supabase` instead of introducing new auth libraries.

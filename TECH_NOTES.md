# Tech Notes

## Module 9 — Baseline environment
- Node: v20.19.5 (`node -v`)
- npm: 11.4.2 (`npm -v`, warns about unknown env config "http-proxy")

## Module 9 — Baseline checks (before code changes)
### npm install
- Result: up to date, audited 768 packages in 3s (8 vulnerabilities reported)

### npm run build
- Result: FAIL
- Summary: ESLint errors during `next build`:
  - `src/app/admin/layout.tsx` line 31: `@typescript-eslint/no-explicit-any`
  - `src/app/projects/[projectSlug]/layout.tsx` line 41: `@typescript-eslint/no-explicit-any`
  - `src/components/projects/ProjectHeader.tsx` lines 33, 43: `@typescript-eslint/no-explicit-any`
  - `src/components/projects/timeline/MilestoneDetailPanel.tsx` line 39: `@typescript-eslint/no-explicit-any`
  - `src/server/pushes.ts` line 3: `@typescript-eslint/no-unused-vars`

### npm run lint
- Result: FAIL
- Summary: Same ESLint errors as `npm run build` (see above).

### npm run test --if-present
- Result: PASS (13 test files, 23 tests passed, 7 skipped)
- Note: console warning about Vite CJS Node API deprecation.

## Module 9 — Findings & plan (before code changes)
### Findings
- `next build` and `next lint` fail due to explicit `any` usage and one unused import.

### Suspected root causes
- TypeScript `any` usage in layout/components where stricter types are expected:
  - `src/app/admin/layout.tsx`
  - `src/app/projects/[projectSlug]/layout.tsx`
  - `src/components/projects/ProjectHeader.tsx`
  - `src/components/projects/timeline/MilestoneDetailPanel.tsx`
- Unused import in `src/server/pushes.ts`.

### Proposed fix plan
- Replace `any` annotations with specific types or safer, minimal alternatives.
- Remove unused import in `src/server/pushes.ts`.
- Verify by re-running:
  - `npm run lint`
  - `npm run build`
  - `npm run test --if-present`

## Module 9 — Fixes & verification (after code changes)
### Server actions boundary + build failures
- Symptom: `next build` failed with “A "use server" file can only export async functions” plus layout/client action import warnings.
- Root cause: `actions.ts` modules exported non-async constants/types (initial state, status options), and client components imported server action modules directly for forms.
- Fix:
  - Moved form state/types/options into dedicated `formState.ts` modules for admin and pushes.
  - Updated client forms to import initial state/types from `formState.ts` and keep server action modules async-only.
  - Passed overview actions into client components via props to keep client modules clean.
- Verification: `npm run build` PASS

### Hydration mismatch on project overview forms
- Symptom: Hydration warning about mismatched `<input>`/`<form>` in Project Overview.
- Root cause: A `<form>` element was rendered directly inside `<tbody>`, which is invalid HTML and can cause DOM reshuffling before hydration.
- Fix: Moved the hidden form into a `<td>` within the row and kept inputs linked via the `form` attribute.
- Verification: `npm run test --if-present` PASS (added KeyResultRowForm structure regression test)

### Form state crashes on first render
- Symptom: Potential crashes accessing `state.errors.title`/`state.errors.code` when initial state is undefined.
- Root cause: Missing initial state constant for cycle status and server-action props were not provided by parent.
- Fix: Added `cycleStatusInitialState` and ensured client components receive server actions and initial state consistently.
- Verification: `npm run test --if-present` PASS

### Login build error (useSearchParams)
- Symptom: `next build` failed with “useSearchParams() should be wrapped in a suspense boundary”.
- Root cause: `useSearchParams` used directly in the `/login` page component without a Suspense boundary.
- Fix: Split login into `LoginClient` (client component) and wrapped it in `<Suspense>` with a fallback in `page.tsx`.
- Verification: `npm run build` PASS

### Lint failures (explicit any / unused import)
- Symptom: ESLint failures from `no-explicit-any` and unused import.
- Root cause: `as any` in Link props and an unused helper in `src/server/pushes.ts`.
- Fix: Replaced external Next links with anchors, typed admin links, and removed the unused helper.
- Verification: `npm run lint` PASS

### Importer run path documentation
- Run command: `npm run import:data` or `npm run import-dashboard-data`
- Expected inputs: CSV files per project folder in `data/import/<project>`; requires `DATABASE_URL` and Supabase envs set for local DB.
- Local verification status: BLOCKED — `DATABASE_URL` not set in this environment, so the importer and UI verification could not be run here.

### Verification summary
- `npm run lint` PASS
- `npm run build` PASS
- `npm run test --if-present` PASS

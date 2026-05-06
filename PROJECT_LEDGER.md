# Project Ledger

Current database policy is defined by the newest entry below. Older entries are retained as historical record and may describe superseded `DIRECT_URL` behavior that is no longer active.

## 2026-05-06 - Prisma schema-engine status diagnostics and migration-history guard

- Diagnosed the remaining `npm run db:status` failure after the `DATABASE_URL`-only cutover. Raw `npx prisma migrate status` still targets the Supabase Session Pooler host from `DATABASE_URL`, but Prisma returns only `Error: Schema engine error:`.
- Added the safer status wrapper as the active `db:status` command. `scripts/db-status.mjs` now validates `DATABASE_URL`, warns separately when `prisma/migrations` is missing, runs a non-mutating Prisma `SELECT 1` connectivity preflight, retries one transient `P1001`, and reports concrete Prisma errors without printing secrets.
- Current live diagnostic result: the wrapper surfaced a transient `P1001` reachability failure followed by `P1000` authentication failure against the Session Pooler. This means the bare schema-engine error is masking an environment-specific connection/credential problem, not a `DIRECT_URL` regression and not a Prisma schema syntax problem.
- Confirmed `prisma/migrations` is still absent. This is not the current connectivity failure, but it remains a separate migration deploy blocker. `db:apply` now fails closed before `migrate deploy` when no committed `migration.sql` files exist.
- Updated the manual GitHub Actions workflow so pre-migration status can continue only for pending/uninitialized migration status after connectivity succeeds; connection failures still fail closed.
- Pinned `prisma` and `@prisma/client` to the verified aligned `7.8.0` pair in `package.json` and `package-lock.json`.
- Updated `.env.example` and README to document that the Supabase Session Pooler URL on port `5432` does not require `pgbouncer=true` for this workflow unless official troubleshooting for the exact pooler mode says otherwise.
- Added a repo-specific Supabase skill override preserving Prisma as the canonical migration workflow and prohibiting `DIRECT_URL`, direct hosts, `db push`, and `migrate reset` as production repair paths.
- Redacted the secret-looking `Guide-Files/env_backup.txt` database placeholders and added it to `.gitignore` so local env backups are not committed.
- Verification: script syntax checks passed; `npm run db:validate` passed; `npx prisma validate` passed; `npx prisma generate` passed; raw `npx prisma migrate status` still returned the bare schema-engine error; `npm run db:status` now reports the concrete preflight blocker and exits 1; `npm run typecheck` passed; `npm run build` passed.
- Safety: `DIRECT_URL` was not restored; no Supabase direct host was introduced; no migration was created or applied; `db:apply` was not run; no destructive Prisma command was run; no secrets were intentionally printed.

## 2026-05-06 - DATABASE_URL-only Prisma and Supabase Session Pooler workflow

- Removed `DIRECT_URL` from the active Prisma/database workflow. Prisma CLI, migration status, migration deploy, client generation, app validation, runtime DB config, and GitHub Actions now use `DATABASE_URL` only.
- Updated `prisma.config.ts` so datasource resolution is always `env("DATABASE_URL")`; the canonical value should be the Supabase Session Pooler URL.
- Updated DB scripts to validate and print sanitized diagnostics for `DATABASE_URL` only, warn when `DATABASE_URL` looks like a Supabase direct host, and avoid printing usernames, passwords, query strings, or raw URLs.
- Updated `.env.example`, `README.md`, `.github/workflows/db-migrate.yml`, `src/lib/config/env.ts`, and `scripts/app-validate-env.mjs` to remove active direct-URL support and document the one-variable policy.
- Updated `dailymotion_discovery_ledger.md` with the decision, reason, files changed, verification plan, risks, and future-agent instructions.
- Verification: `npm run db:validate` passed with `DATABASE_URL` only; `npm run db:status` used the Session Pooler host from `DATABASE_URL` and did not attempt the Supabase direct host, but Prisma returned a bare schema-engine error; `npm run typecheck` passed; `npm run build` passed.
- Safety: no destructive Prisma commands were added or run; `db:apply` was not run; no secrets were copied into documentation.

## 2026-05-06 - Full dotenv, DATABASE_URL fallback, migrations, and UI hardening

- Added explicit `dotenv` loading for standalone Node/Prisma paths with file priority `.env.local`, `.env`, `.env.development`, `.env.production`, while preserving real `process.env` precedence.
- Updated DB/app validation so `DATABASE_URL` is the only required database variable; `DIRECT_URL` is optional, may equal `DATABASE_URL`, and falls back to `DATABASE_URL` when missing/blank/placeholder.
- Updated `prisma.config.ts` to load env with `dotenv` and keep Prisma CLI/migration resolution as valid `DIRECT_URL` first, `DATABASE_URL` fallback second.
- Updated `scripts/db-apply.mjs` to print sanitized connection mode, require `CONFIRM_DB_APPLY=true` for Supabase/pooler/production-like targets, run pre/post migration status, deploy, and generate without destructive commands.
- Split public Supabase env into `src/lib/config/public-env.ts` so middleware/proxy and browser helpers do not import server DB/Gemini validation.
- Updated GitHub Actions migration workflow so only `DATABASE_URL` is required and `DIRECT_URL` is optional.
- Installed `dotenv` and updated `package.json`/`package-lock.json`.
- Refreshed the UI with smaller-radius shared tokens, premium light/dark surfaces, no radial decorative backgrounds, icon theme toggle, cleaner app shell, improved result grids, filters, and zero-safe video cards.
- Updated `.env.example`, `README.md`, and `.gitignore` for Session Pooler-first Supabase free-plan guidance, optional direct URL, secret handling, Vercel/GitHub env setup, and migration commands.
- Verification: `node -c` on scripts passed; temp `.env.local` with only `DATABASE_URL` passed; temp `.env.local` with both DB vars passed; `npm run db:validate` passed with `DATABASE_URL` and placeholder `DIRECT_URL` fallback; `npm run env:validate` passed with safe non-secret env; `npm run typecheck` passed; `npm run build` passed; dev server routes `/`, `/channel-explorer`, `/search`, `/ai-search`, and `/saved` returned HTTP 200.
- Limitations: real `db:status`/`db:apply` were not run against the user's database; `db:status` was attempted only with a safe placeholder pooler host and failed before a real connection. The current local `.env.local` appears to contain reserved password characters that need URL encoding before real Prisma connectivity can be validated.


## 2026-05-06 — Vercel 2026 env/bootstrap hardening

- Added `scripts/load-project-env.mjs` using `@next/env` so standalone Node/Prisma scripts follow Next.js root `.env*` loading instead of requiring manual shell export only.
- Added `scripts/app-validate-env.mjs` plus `npm run env:validate`, and wired `npm run build` to fail early when Vercel-required env keys are missing or malformed.
- Updated `prisma.config.ts` to use `@next/env` instead of `dotenv/config`, keeping Prisma CLI aligned with `.env.local` and Vercel env pulls.
- Renamed `src/middleware.ts` to `src/proxy.ts` to remove the Next.js 16 middleware deprecation warning during production builds.
- Added `.local.env` and `src/.local.env` guardrails/documentation because they are not supported Next.js/Vercel env file names or locations.
- Verification target in this environment: `npm run typecheck`, `npm run env:validate`, `npm run db:validate`, and `npm run build` with safe placeholder env values.


## 2026-05-06 — Prisma CLI DIRECT_URL precedence verification

- Audited `prisma.config.ts`, `package.json` db scripts, `scripts/db-apply.mjs`, and `scripts/db-validate-env.mjs` to verify migration/status/deploy flow.
- Updated `prisma.config.ts` so Prisma CLI datasource resolution prefers `DIRECT_URL`, falling back to `DATABASE_URL` only when `DIRECT_URL` is unset/blank.
- Confirmed existing validation/apply scripts still require both env vars and explicitly allow `DIRECT_URL === DATABASE_URL` for Supabase Session Pooler workflows.
- Updated README Prisma 7.8 config section to document DIRECT_URL-first CLI resolution and DATABASE_URL fallback behavior.
- Safety: no destructive commands run; no secrets printed or hardcoded.

## 2026-05-06 — GitHub Actions migration workflow hardening audit

- Audited and updated `.github/workflows/db-migrate.yml` for manual `workflow_dispatch`-only execution with required inputs (`confirm`, `environment`, `run_apply`).
- Added preflight secrets-presence gate that fails closed when `DATABASE_URL` or `DIRECT_URL` are missing from GitHub Actions secrets.
- Added pre-migration `npm run db:status` and post-migration `npm run db:status` checks so failures stop before apply and verification runs after.
- Added explicit confirmation gate so `db:apply` runs only when `run_apply=true` and confirmation input is `APPLY`/`true`; otherwise workflow runs safe status-only path.
- Kept apply path on `npm run db:apply` with `CONFIRM_DB_APPLY=true`; no destructive commands (`migrate reset`, table drops, or `db push` production apply path) were introduced.
- Confirmed Prisma 7.8 config model remains compatible (`prisma.config.ts` datasource env resolution + provider-only datasource in `prisma/schema.prisma`).
- Confirmed Supabase Session Pooler compatibility is preserved for both `DATABASE_URL` and `DIRECT_URL` in scripts/docs.
- Updated README GitHub Actions section with exact secret path, manual run flow, status-only mode, and Vercel build prohibition for migrations.
- Files changed: `.github/workflows/db-migrate.yml`, `README.md`, `PROJECT_LEDGER.md`.
- Verification in this environment: YAML parsed successfully; `npm run db:validate` passed with safe placeholder URLs; `npm run typecheck` passed; real migration apply execution must be run by user in GitHub Actions with repository secrets.

## 2026-05-06 — Prisma 7.8 datasource config fix for Session Pooler workflows

- Added root `prisma.config.ts` and moved datasource `url`/`directUrl` resolution there using `prisma/config` + `env()` for Prisma CLI 7.8 compatibility.
- Kept `prisma/schema.prisma` datasource block provider-only (`postgresql`) to avoid Prisma 7 schema/config incompatibility errors.
- Preserved online-first Supabase guidance: `DATABASE_URL` uses Session Pooler, and `DIRECT_URL` may safely equal `DATABASE_URL` in IPv4-only Vercel/Codespaces/GitHub Actions environments.
- Updated README with explicit Prisma 7.8 datasource config behavior and Session Pooler mapping notes.
- Safety: no resets/drops/destructive commands; no secrets printed or hardcoded.
- Verification in this environment: `npm run db:validate` passed with placeholder env; `npm run db:status` could not run without configured DB env access; `npm run typecheck` still reports pre-existing project TypeScript issues unrelated to this Prisma config fix.

## 2026-05-06 — MVP foundation and Channel Explorer

- Created a strict TypeScript Next.js App Router foundation with Tailwind CSS, shadcn-style primitives, Framer Motion dependency, Prisma SQLite schema, and server/public env separation.
- Added canonical normalized video metadata, manifest, platform, and filter types.
- Implemented Dailymotion public API adapter, URL/channel input analyzer, zero-safe normalizer, first-page fetch, and safe Fetch All pagination defaults (250ms delay, 200 pages, 10,000 videos).
- Built Channel Manifest creation with deduplication, request IDs, partial/complete flags, and stale response prevention in the Channel Explorer client.
- Built advanced manifest-only filtering and sorting utilities that do not mutate original manifest items and preserve `0` as valid metadata.
- Added responsive app shell, Channel Explorer page, video cards with hover-mounted Dailymotion embeds, progress, manifest summary, active filter chips, empty/error states, and server-only Gemini route foundations.
- Confirmed no video downloading, rehosting, private stream scraping, or restriction bypassing was added.

## 2026-05-06 — Supabase/PostgreSQL production foundation upgrade

- Inspected existing MVP and migrated Prisma datasource from SQLite to PostgreSQL with `DIRECT_URL` support for Supabase.
- Added Supabase SSR-safe client/server/middleware helpers (`@supabase/ssr`) and app middleware session refresh wiring.
- Replaced minimal SavedVideo-only Prisma model with relational production foundation models: video_sources, videos, manifests, manifest_items, fetch_jobs, saved_videos.
- Added typed Zod env validation with strict public/server separation and fail-fast parsing.
- Expanded `.env.example` with required public, required server-only, and optional future variables for scalable fetch and AI metadata workflow.
- Added db scripts: `db:generate`, `db:migrate`, `db:push`, `db:studio`.
- Verification: typecheck/build not executed in this pass because package lock/install refresh is required after dependency changes.
- Limitation: this change establishes database + Supabase foundations; route-by-route migration to persisted manifests/fetch jobs remains incremental to preserve current working channel explorer behavior.

## 2026-05-06 — External integration hardening and optional Dailymotion key

- Refactored env parsing into required server/public + optional server env buckets; added defaults and helper accessors.
- Confirmed `DAILYMOTION_API_KEY` remains server-only and optional, with public metadata mode by default.
- Added typed safe result model for Dailymotion calls with timeout, status/reason mapping, and controlled unauthorized/rate-limit/network handling.
- Updated channel fetch-all route to preserve partial manifest items on mid-stream failures and return retry metadata.
- Updated AI client/routes to return controlled unavailable/missing-config payloads without leaking internals.
- Updated `.env.example` and README docs for Vercel-first workflows and required/optional env behavior.
- Verification: `npm run typecheck` currently fails due to pre-existing type issues in this patch (see command output).
- Limitation: full persisted fetch-job resume flow is not yet implemented; this change preserves partial manifest in API/UI response for safe retry UX.

## 2026-05-06 — Online-first Prisma migration workflow for Supabase/Postgres

- Added professional online-first migration scripts in `package.json`: `db:validate`, `db:status`, `db:apply`, `db:migrate:deploy`, `db:create-migration`, `db:generate`, and `db:studio`.
- Created `scripts/db-validate-env.mjs` to require `DATABASE_URL` + `DIRECT_URL`, validate PostgreSQL URL format, and print only sanitized metadata (no secrets).
- Created `scripts/db-apply.mjs` to run safe preflight checks, require `CONFIRM_DB_APPLY=true` for production-like targets, execute `prisma migrate status`, `prisma migrate deploy`, and `prisma generate`.
- Added manual GitHub Actions workflow `.github/workflows/db-migrate.yml` with `workflow_dispatch` trigger only for safer controlled migration runs.
- Updated `.env.example` with explicit comments for `DATABASE_URL` (runtime) vs `DIRECT_URL` (migration/direct), Supabase Dashboard source, and secrets handling guidance.
- Expanded README with online migration workflow, Codespaces execution path, GitHub Actions manual flow, safety rules, command differences, and troubleshooting.
- Safety guarantee: no destructive commands were added (`prisma migrate reset` not used, no table drops, no auto-delete behavior).
- Tests run in this environment:
  - `npm run db:validate` with mocked safe PostgreSQL URLs: passed.
  - `npm run db:status`: blocked here due to unavailable real database connection/secrets.
  - `npm run db:apply`: intentionally not executed against unknown/unconfigured database in this environment.
  - `npm run typecheck`: failed due to pre-existing project TypeScript issues unrelated to this migration workflow update.

## 2026-05-06 — Supabase Session Pooler strategy for IPv4-only online environments

- Updated server env validation (`src/lib/config/env.ts`) to enforce PostgreSQL URL shape for `DATABASE_URL` and `DIRECT_URL` without assuming `DIRECT_URL` must be a Supabase direct host.
- Added non-fatal runtime warning when `DIRECT_URL` targets `db.<project-ref>.supabase.co`, noting potential IPv6-only connectivity issues in Vercel/Codespaces/GitHub Actions.
- Updated `.env.example` to explicitly document Session Pooler-first guidance for `DATABASE_URL` and allow `DIRECT_URL=DATABASE_URL` for IPv4-only online workflows.
- Updated `scripts/db-validate-env.mjs` to accept Session Pooler URLs for both variables, print only sanitized host metadata, and warn on Supabase direct host usage.
- Updated `scripts/db-apply.mjs` to always run db env validation first and provide clear Prisma connection troubleshooting emphasizing Session Pooler fallback.
- Updated `README.md` with a dedicated "Supabase connection strategy for Vercel/Codespaces" section covering Vercel/Codespaces/GitHub Actions secret placement and IPv4/IPv6 guidance.
- Prisma datasource kept as `url=DATABASE_URL` and `directUrl=DIRECT_URL`; no hardcoded credentials and no IPv6-only requirement introduced.
- Files changed: `src/lib/config/env.ts`, `.env.example`, `scripts/db-validate-env.mjs`, `scripts/db-apply.mjs`, `README.md`, `PROJECT_LEDGER.md`.
- Tests in this environment:
  - `npm run db:validate` with placeholder Session Pooler env vars: passed.
  - `npm run typecheck`: failed due to pre-existing TypeScript issues unrelated to this DB connection strategy change.
  - `npm run db:status` and `npm run db:apply`: not run here due to missing real database credentials/access in this environment.

## 2026-05-06 — UI/UX design system refresh with warm dual-theme foundation

- Audited existing app shell, page surfaces, cards, form controls, and Channel Explorer hierarchy before implementation.
- Replaced cool/blue-heavy surface defaults with a coherent warm token system in `src/app/globals.css` using CSS variables for background layers, foreground, muted text, border, accent, and focus ring.
- Added a reliable client theme toggle plus no-flash bootstrapping script in `src/app/layout.tsx` and `src/components/layout/theme-toggle.tsx` with localStorage persistence and system preference fallback.
- Refined top navigation and overall shell spacing/visual rhythm in `src/components/layout/app-shell.tsx`.
- Upgraded foundational UI primitives (`Card`, `Button`, `Input`) to use shared tokenized styling for consistent radius, borders, shadows, and focus states.
- Redesigned `VideoCard` presentation with stronger hierarchy, cleaner metadata grouping, calmer hover treatment, and improved scannability.
- Polished key page shells (`/`, `/search`, `/saved`, and Channel Explorer heading/summary zone) for clearer hierarchy and calmer spacing.
- No platform logic or API behavior was changed.

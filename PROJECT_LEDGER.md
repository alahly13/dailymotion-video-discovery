# Project Ledger


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

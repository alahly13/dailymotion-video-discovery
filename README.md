# AI Public Video Discovery Platform

Next.js App Router application for public Dailymotion video metadata discovery and research.

This platform is not a downloader. It does not download, rehost, scrape private streams, or bypass platform restrictions.

## Setup

```bash
npm install
cp .env.example .env.local
npm run db:generate
npm run dev
```

Use a root `.env.local` for local and online terminals. The scripts load env files with `dotenv` in this priority: `.env.local`, `.env`, `.env.development`, `.env.production`. Real `process.env` values from Vercel, GitHub Actions, Codespaces, or Codex take priority over file values.

## Required Env

Public/browser-safe:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Server-only:

- `DATABASE_URL`: required. Use the Supabase Session Pooler connection string.
- `GEMINI_API_KEY`: required for AI routes.

Never expose `DATABASE_URL`, `GEMINI_API_KEY`, or service role keys as `NEXT_PUBLIC_*`. Do not create `NEXT_PUBLIC_DATABASE_URL`.

## Supabase Connection Strategy

For this free-plan, IPv4-limited workflow, use Supabase Session Pooler for `DATABASE_URL`:

```env
DATABASE_URL="postgresql://postgres.<project-ref>:<percent-encoded-password>@aws-0-<region>.pooler.supabase.com:5432/postgres"
```

Use one database variable only: `DATABASE_URL`. Copy the Supabase Session Pooler URI from the Supabase dashboard Connect panel. This project does not use `DIRECT_URL`; do not configure it as a migration override, fallback, or duplicate URL.

Supabase direct database hosts like `db.<project-ref>.supabase.co` can require IPv6 or a paid IPv4 add-on. In IPv4-limited Windows terminals, online agents, GitHub Actions, Codespaces, and many deployment environments, a direct host can fail with Prisma `P1001`. The Session Pooler host shape is:

```text
aws-0-<region>.pooler.supabase.com
```

If your Supabase password contains reserved URL characters such as `#`, `@`, `?`, `/`, or `$`, percent-encode those characters before pasting the connection string.

`db:status` and `db:apply` add `connect_timeout=30` to Prisma CLI child processes when `DATABASE_URL` has no explicit `connect_timeout`. This is a process-only Supabase P1001 hardening default; it does not rewrite your `.env` file or change the target database. Override it with `PRISMA_CONNECT_TIMEOUT_SECONDS` only if you have a specific reason.

Windows PowerShell and online terminals should use a root `.env.local`:

```powershell
Copy-Item .env.example .env.local
npm run db:validate
npm run db:status
```

## Prisma And Migrations

Prisma 7 reads connection settings from `prisma.config.ts`; `prisma/schema.prisma` keeps only `provider = "postgresql"`. Runtime route handlers use Prisma Client through `@prisma/adapter-pg` and `pg`, with a small server-side pool created from `DATABASE_URL`.

Connection resolution:

- Runtime server DB access uses `DATABASE_URL`.
- Prisma CLI, `db:status`, `db:apply`, migration deploys, client generation, and Prisma Studio use `DATABASE_URL`.
- The Direct Connection URI from Supabase is intentionally not part of this project's active workflow.

Commands:

- `npm run db:validate`: loads dotenv, requires only `DATABASE_URL`, and prints sanitized host metadata only.
- `npm run db:status`: runs a sanitized status wrapper that validates env, checks `SELECT 1` connectivity, then runs `prisma migrate status`.
- `npm run db:apply`: runs validation, pre-status, `prisma migrate deploy`, `prisma generate`, and post-status.
- `npm run db:migrate:deploy`: direct Prisma deploy command.
- `npm run db:create-migration`: developer-only migration creation command.
- `npm run db:generate`: generates Prisma Client.
- `npm run db:studio`: opens Prisma Studio.

`npm run db:apply` refuses Supabase, pooler, production-like, and Vercel production targets unless `CONFIRM_DB_APPLY=true` is set.

### Migration Status Diagnostics

`npm run db:status` is intentionally wrapped by `scripts/db-status.mjs` instead of calling Prisma directly. Prisma 7 can return a bare `Schema engine error:` from `prisma migrate status`; the wrapper first runs a non-mutating `SELECT 1` through Prisma so authentication, reachability, and URL-format failures are reported with concrete Prisma error codes such as `P1000` or `P1001`.

For the Supabase Session Pooler URL on port `5432`, this repo keeps the copied Session Pooler URL as the `DATABASE_URL` value and applies the timeout hardening in the scripts. Do not add `pgbouncer=true` to the Session Pooler URL unless official troubleshooting for your exact pooler mode calls for it.

### Migration History And Apply Status

The reviewed Prisma migration history now exists under `prisma/migrations`, and `20260506_channel_deep_fetch_history_persistence_foundation` has been applied to the configured Supabase target used in this workspace. Future databases or restored environments must still be checked with `npm run db:status` before applying migrations.

Safe future apply path:

1. Confirm `DATABASE_URL` points to the intended Supabase Session Pooler target.
2. Run `npm run db:validate` and `npm run db:status`.
3. Review any pending migration names and SQL before applying.
4. Apply only with explicit confirmation: `CONFIRM_DB_APPLY=true npm run db:apply`.

Production safety:

- Do not run `prisma migrate reset`.
- Do not drop tables through helper scripts.
- Do not use `prisma db push` as the production apply path.
- Do not print raw database URLs or passwords.

## Vercel

Configure required variables in Project Settings -> Environment Variables. After changing env values, create a new deployment so the updated values are available to build and runtime.

Required Vercel database variable:

- `DATABASE_URL`: Supabase Session Pooler URI.

`npm run build` runs the application env preflight through `scripts/app-validate-env.mjs`, then runs `prisma generate`, then `next build`. Vercel should provide real env values; placeholder build stubs in code are only a build-time guard and are not used for runtime DB access.

## GitHub Actions

The manual workflow is `.github/workflows/db-migrate.yml`.

Required secret:

- `DATABASE_URL`

Manual migration flow:

1. Open Actions -> Apply database migrations.
2. Select `run_apply=true` to apply, or `false` for status-only mode.
3. Use `confirm=APPLY` or `confirm=true` for apply mode.
4. The workflow runs validation, status, guarded apply, post-status, and client generation.

No secrets are printed by the workflow or database scripts.

## Local Checks

```bash
npm run env:validate
npm run db:validate
npm run typecheck
npm run build
```

`npm run db:status` requires real database access. `npm run db:apply` should only be run against the intended target with `CONFIRM_DB_APPLY=true`.

## Optional Integrations

- `DAILYMOTION_API_KEY` is optional. Public metadata routes run without it where Dailymotion endpoints allow anonymous access.
- `SUPABASE_SERVICE_ROLE_KEY` is optional and server-only for privileged flows.
- AI route failures return controlled unavailable payloads when Gemini is not configured or temporarily unavailable.

## Channel Explorer Deep Fetch

`/channel-explorer` separates fetch settings from result filters:

- Fetch settings control how public metadata is collected from Dailymotion.
- Result filters only filter and sort videos already collected in the current manifest.
- Filter changes never trigger Dailymotion API requests.
- Fetch settings only start API work when the user explicitly starts or resumes a fetch.

Fetch profiles:

- `quick-preview`: one API page for source verification.
- `standard-fetch`: one result window, bounded by `MAX_CHANNEL_FETCH_PAGES` for legacy compatibility.
- `deep-balanced`: yearly windows that split capped years into months.
- `deep-aggressive`: recursive year/month/week/day splitting within hard caps.
- `recent-sync`: recent date-range collection.
- `historical-backfill`: older date-range collection.
- `custom-expert`: manual caps, window units, delay, and split behavior.

Dailymotion can cap a single result window around 1000 videos. Deep fetch uses public `created_after` and `created_before` filters with bounded `limit`/`page` pagination, deduplicates by Dailymotion video ID, and never claims full coverage unless every planned window finishes without caps, failures, stops, or max-limit interruptions.

Channel metadata requests use public profile metadata when available, including `videos_total`. The UI labels this as "Reported total from Dailymotion"; it is not a guaranteed collectable total because private, deleted, unavailable, or geo-restricted videos may affect comparison.

Current persistence status:

- When `ENABLE_MANIFEST_PERSISTENCE=true`, Channel Explorer writes source metadata, catalog snapshots, fetch jobs, windows, page attempts, temporary manifests, manifest items, and videos through Prisma/Supabase.
- Fetch history, coverage, and resumable checkpoints are read from the database and survive browser refreshes, server restarts, and deployment runtime replacement.
- When DB persistence is disabled or unavailable, the routes fall back to runtime memory and the UI shows "Persistence unavailable: history may reset after restart/deploy."
- Temporary manifests and fetch jobs have TTL fields; canonical videos, video sources, saved videos, and collections are durable and must not be cleaned up by temporary-history retention.

New server hard caps:

- `MAX_CHANNEL_FETCH_TOTAL_PAGES`: total API pages across all windows.
- `MAX_CHANNEL_FETCH_WINDOWS`: total date windows a job may plan/process.
- `MAX_CHANNEL_FETCH_WINDOW_DEPTH`: maximum recursive split depth.
- `MAX_CHANNEL_FETCH_PAGE_SIZE`: maximum Dailymotion page size, capped at 100.
- `CHANNEL_FETCH_MIN_DELAY_MS`: minimum delay the browser cannot bypass.
- `CHANNEL_FETCH_DEFAULT_PROFILE`: default fetch profile.
- `CHANNEL_FETCH_JOB_TTL_HOURS` and `TEMP_MANIFEST_TTL_HOURS`: temporary operational retention.

The migration foundation is expected under:

```text
prisma/migrations/20260506_channel_deep_fetch_history_persistence_foundation/migration.sql
```

Run `npm run db:status` before future applies and confirm the target database before setting `CONFIRM_DB_APPLY=true`.

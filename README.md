# AI Public Video Discovery Platform

Next.js App Router application for public Dailymotion video metadata discovery and research.

## 2026 upgrade highlights

- Supabase SSR client helpers for browser/server/middleware session handling.
- Prisma datasource migrated from SQLite MVP to Supabase PostgreSQL (`DATABASE_URL` + `DIRECT_URL`).
- New durable relational schema for canonical videos, sources, manifests, manifest items, fetch jobs, and user saved videos.
- Typed environment validation with Zod and fail-fast env parsing.

## Safety scope

This platform is **not** a downloader. It does not download/rehost videos, scrape private streams, or bypass platform restrictions.

## Setup

```bash
npm install
cp .env.example .env.local
npm run db:generate
npm run dev
```

## Online database migration workflow

This project uses committed Prisma migration files plus `prisma migrate deploy` for safe, predictable Supabase/Postgres schema updates.

### NPM migration commands

- `npm run db:validate` — validates `DATABASE_URL` and `DIRECT_URL` and prints sanitized metadata only.
- `npm run db:status` — shows Prisma migration status.
- `npm run db:apply` — runs preflight validation, shows sanitized target summary, runs `prisma migrate status`, then `prisma migrate deploy`, then `prisma generate`.
- `npm run db:migrate:deploy` — direct Prisma deploy command.
- `npm run db:create-migration` — developer-only command to create migration files (`prisma migrate dev --create-only`).
- `npm run db:studio` — opens Prisma Studio (if environment supports UI access).

### Required Supabase connection strings

- `DATABASE_URL`: pooled/runtime connection used by the running app.
- `DIRECT_URL`: direct connection for Prisma migration and direct operations.
- Get both in **Supabase Dashboard → Connect**.
- Configure both as secrets/environment variables in Codespaces, GitHub Actions, and Vercel.

### Difference between `db:apply` and `db:create-migration`

- `db:create-migration` creates new migration files during development and review.
- `db:apply` applies already-committed migration files to a target database.
- Production should use `db:apply`/`prisma migrate deploy`, not `db push`.

## How to run migrations from GitHub Codespaces

1. Open the repository on GitHub.
2. Click **Code**.
3. Choose **Open with Codespaces**.
4. Create or select a Codespace.
5. Add Codespaces secrets for:
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `GEMINI_API_KEY`
   - and other required values from `.env.example`
6. Run `npm install`.
7. Run `npm run db:validate`.
8. Run `npm run db:status`.
9. Run `CONFIRM_DB_APPLY=true npm run db:apply`.
10. Run `npm run typecheck` (if dependencies are installed).
11. Commit generated migration files if you created new migrations.

## How to run migrations from GitHub Actions

A manual workflow is available at `.github/workflows/db-migrate.yml`.

- Workflow name: **Apply database migrations**
- Trigger: `workflow_dispatch` only (manual)
- Required repository secrets:
  - `DATABASE_URL`
  - `DIRECT_URL`
- Run sequence:
  1. Checkout repository
  2. Setup latest Node.js LTS
  3. Install dependencies (`npm ci` if lockfile exists, otherwise `npm install`)
  4. `npm run db:validate`
  5. `CONFIRM_DB_APPLY=true npm run db:apply`

## Production safety rules

- Never run `prisma migrate reset` on production.
- Never drop tables or auto-delete data via migration helper scripts.
- Never print or paste raw `DATABASE_URL`/`DIRECT_URL` in logs, docs, or ledgers.
- `db:apply` refuses to run for production-like targets unless `CONFIRM_DB_APPLY=true` is set.
- Do not auto-run production migrations on every push unless explicitly approved.

## Troubleshooting

- **`npm install` blocked/fails**: verify registry/network access in Codespaces or CI and retry.
- **Missing env vars**: run `npm run db:validate`; ensure `DATABASE_URL` and `DIRECT_URL` are set as secrets.
- **Database connection errors**: verify Supabase host, credentials, SSL mode, and network rules from Dashboard → Connect.
- **Migration conflicts**: run `npm run db:status`, review committed `prisma/migrations`, resolve drift before deploying.

## Environment and fallback behavior

- `DAILYMOTION_API_KEY` is optional. Public Dailymotion metadata routes run without it where endpoints allow anonymous access.
- Required envs fail fast: `DATABASE_URL`, `DIRECT_URL`, `GEMINI_API_KEY`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- Optional envs never block startup; they only limit related features.
- Dailymotion API failures return typed safe responses (`rate_limited`, `network_error`, `invalid_response`, `unauthorized`, `unavailable`) and preserve partial manifest data.
- Gemini failures are isolated to AI routes and return controlled `ok: false` payloads.
- Supabase service role key is optional/server-only and should only be used for privileged flows.


## Supabase connection strategy for Vercel/Codespaces

### Session Pooler vs Direct connection

- **Session Pooler (`*.pooler.supabase.com`)**: best default for online IPv4-first environments (Vercel, GitHub Codespaces, GitHub Actions).
- **Direct (`db.<project-ref>.supabase.co`)**: can require IPv6 support (or paid IPv4 add-on), so it may fail on IPv4-only networks.

### Recommended environment variable mapping

- `DATABASE_URL` (server-only, required): use Supabase Session Pooler.
- `DIRECT_URL` (server-only, required for Prisma migrations):
  - use direct URL only when IPv6 works in your environment, or
  - reuse the same Session Pooler value as `DATABASE_URL` when IPv6 direct connectivity is unavailable.

### Where to configure secrets

- **Vercel**: Project → Settings → Environment Variables
  - Add `DATABASE_URL`, `DIRECT_URL`, and all other required keys from `.env.example`.
- **GitHub Codespaces**: Repository/Account Codespaces Secrets
  - Add `DATABASE_URL`, `DIRECT_URL`, and required app/API keys.
- **GitHub Actions**: Repository → Settings → Secrets and variables → Actions
  - Add `DATABASE_URL` and `DIRECT_URL` for `.github/workflows/db-migrate.yml` and any runtime workflows.

### Security reminders

- Never commit real `.env` values.
- Never expose `DATABASE_URL` or `DIRECT_URL` as `NEXT_PUBLIC_*`.
- Migration/validation scripts in this repo print sanitized host metadata only (no passwords/full URLs).

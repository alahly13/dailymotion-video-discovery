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

Windows PowerShell and online terminals should use a root `.env.local`:

```powershell
Copy-Item .env.example .env.local
npm run db:validate
npm run db:status
```

## Prisma And Migrations

Prisma 7 reads connection settings from `prisma.config.ts`; `prisma/schema.prisma` keeps only `provider = "postgresql"`.

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

For the Supabase Session Pooler URL on port `5432`, the current Supabase Prisma guide does not require `pgbouncer=true`. Keep the copied Session Pooler URL as the `DATABASE_URL` value unless official Supabase or Prisma troubleshooting for your exact pooler mode says to add a query parameter.

### Missing Migration History

This repository currently needs a reviewed Prisma migration history before `db:apply` can deploy schema changes. `schema.prisma` alone is not enough for production/staging deploys; Prisma expects committed files under `prisma/migrations`.

Safe baseline path, without applying anything automatically:

1. Fix `DATABASE_URL` until `npm run db:status` reaches the migration-status phase without authentication or connectivity errors.
2. Inspect the real target database state and decide whether it is empty, already matches `schema.prisma`, or needs a custom baseline.
   Review-only diff command after credentials are fixed:
   ```bash
   npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script --output prisma-baseline-review.sql
   ```
3. Create a reviewed baseline migration file with Prisma Migrate tooling, then commit the full `prisma/migrations` folder including `migration_lock.toml`.
4. If the real database already matches the baseline, use `prisma migrate resolve --applied <migration_name>` only after explicit human confirmation for that database.
5. If the database is empty and the baseline is approved, use the guarded `CONFIRM_DB_APPLY=true npm run db:apply` path.

Production safety:

- Do not run `prisma migrate reset`.
- Do not drop tables through helper scripts.
- Do not use `prisma db push` as the production apply path.
- Do not print raw database URLs or passwords.

## Vercel

Configure required variables in Project Settings -> Environment Variables. After changing env values, create a new deployment so the updated values are available to build and runtime.

Required Vercel database variable:

- `DATABASE_URL`: Supabase Session Pooler URI.

`npm run build` runs `npm run env:validate` first through `scripts/app-validate-env.mjs`. Vercel should provide real env values; placeholder build stubs in code are only a build-time guard and are not used for runtime DB access.

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

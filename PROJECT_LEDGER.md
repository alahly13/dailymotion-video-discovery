# Project Ledger

Current database policy is defined by the newest entry below. Older entries are retained as historical record and may describe superseded `DIRECT_URL` behavior that is no longer active.

## 2026-05-07 - Channel Explorer live search, parallel windows, and feedback cards

- Read the required ledgers/docs, README, env example, Prisma schema, Channel Explorer page/components, saved-channel components, video cards, Dailymotion fetch settings/deep-fetch service, manifest/dedupe helper, persistence repository, current Next.js route docs, FlexSearch docs, and Supabase changelog context before editing.
- Added a shared FlexSearch helper at `src/lib/search/video-flexsearch.ts` and wired `/channel-explorer` with a dedicated "Search Current Results" panel. It searches current live attempt results, the loaded combined saved manifest, or the selected/current attempt without calling Dailymotion.
- Updated the Channel Explorer pipeline so local search runs first, advanced Result Filters run second, filter sorting runs third, and the result grid renders fourth. Zero-valued metadata such as `0` views is preserved in searchable text.
- Added server-only independent-window concurrency caps: `CHANNEL_FETCH_CONCURRENCY` and `CHANNEL_FETCH_MAX_CONCURRENCY`. The backend clamps requested concurrency, forces sequential mode for preview/standard/single-window modes, and caps max concurrency at 5.
- Updated the deep-fetch chunk processor to process multiple independent windows per `/jobs/next` request while never processing more than one page from the same window in a single chunk. Resume checkpoints and per-window page order remain auditable.
- Added active/queued window counts, current/max workers, active windows, parallelism reason, and execution-order data to fetch progress. These values persist through existing `FetchJob.progressJson`, `FetchWindow`, `FetchPageAttempt`, and `FetchJobEvent` paths; no schema change was needed.
- Added `ChannelWindowFeedbackPanel` with window/year cards for queued, running, complete, capped, split, failed, and stopped windows, including pages fetched, videos returned, unique added, duplicates skipped, status copy, recent page groups, and resume action when available.
- Reorganized `/channel-explorer` into clearer Source Input, Metadata, Fetch Configuration, Active Progress, Timeline Feedback, Fetch History, Coverage, Manifest Search, Result Filters, Manifest Results, and Export/Open Saved Manifest sections.
- Updated README, `.env.example`, and `dailymotion_discovery_ledger.md` for live search behavior, FlexSearch reuse, parallel fetch behavior, new env variables, feedback persistence, UI organization, and migration/apply status.
- Verification: `npm run db:validate` passed; `npm run db:status` passed and reported the schema up to date; `npx prisma validate` passed; `npx prisma generate` passed; `npm run typecheck` passed; `npm run build` passed on Next.js 16.2.5.
- Runtime smoke: built app served on `http://127.0.0.1:3002`; `/channel-explorer` and `/channels` returned HTTP 200; rendered HTML contained the new Search Current Results, Fetch Timeline / Window Feedback, Window concurrency, and "Search does not call Dailymotion" UI text.
- Manual API smoke: a bounded quick-preview fetch against `https://www.dailymotion.com/channel/news` kept page size 100, used concurrency 1, fetched 1 page, saw 100 returned items, persisted to database, and stopped at the configured 10-item max. A bounded deep-balanced smoke with concurrency 2 selected `2/2` workers and persisted two failed date-window attempts because Dailymotion date-window requests timed out; the failure is represented as persisted failed windows rather than a false coverage claim.
- Saved-search smoke: `POST /api/dailymotion/channel/search-saved` returned database-backed English results for `news` and a UTF-8 Arabic query returned one saved match; these searches used persisted data only and did not call Dailymotion.
- Migration created: no. Migration applied: no. `db:apply` run: no.
- Safety: `DATABASE_URL` remains the only database URL; `DIRECT_URL` was not restored; no private Dailymotion access, video download/scrape/rehost behavior, destructive Prisma command, table drop, or secret printing was introduced.

## 2026-05-07 - Saved channel browser, attempt details, Gemini model env, and saved-results search

- Read the current ledgers/docs, env example, package manifests/lockfile, Prisma schema/migration, current persistence repository, Dailymotion deep-fetch service, Channel Explorer UI, type contracts, Gemini client/env code, local Next.js 16 docs, and current search-library/Gemini docs before editing.
- Added server-only `GEMINI_MODEL` support in `src/lib/config/env.ts` and `src/lib/ai/gemini-client.ts`; missing/blank model falls back to `gemini-1.5-flash`, and neither Gemini key nor model is exposed through `NEXT_PUBLIC_*`.
- Installed `flexsearch@0.8.212` and added a saved-results search split: `POST /api/dailymotion/channel/search-saved` searches persisted Prisma manifest/video rows only, while the channel page builds a FlexSearch index over the intentionally loaded result page for fast local multilingual search.
- Added saved channel APIs and pages: `/channels`, `/channels/[sourceId]`, `/channels/[sourceId]/attempts/[attemptId]`, `GET /api/dailymotion/channel/sources`, `GET /api/dailymotion/channel/[sourceId]/combined-manifest`, `GET /api/dailymotion/channel/[sourceId]/attempts`, and `GET /api/dailymotion/channel/attempts/[attemptId]`.
- Hardened combined source catalog behavior without a schema change: the durable `source-catalog` manifest remains the canonical combined manifest; attempt manifests remain auditable; combined rows keep first-seen provenance and now append source-wide positions for new unique videos instead of reusing attempt-local indexes.
- Strengthened shared manifest/runtime dedupe with `getVideoDedupeKey`: platform video ID first, canonical URL second, then a conservative normalized fingerprint using title, duration, published date, owner/source, thumbnail, and description hash when provider ID is unavailable. DB uniqueness still relies on canonical Dailymotion `platform_video_id` rows and `manifest_items(manifest_id, video_id)`.
- Updated UI navigation and Channel Explorer handoff: app nav/home now link to Channels, Channel Explorer links to saved history, and saved pages can prefill the explorer source/resumable job without triggering provider calls.
- Updated docs and ledgers for `GEMINI_MODEL`, saved channel pages, combined manifest behavior, attempt detail behavior, FlexSearch choice, saved-search limits, dedupe logic, resume labels, and migration/apply status.
- Verification: `npm run db:validate` passed; `npm run db:status` passed and reported schema up to date; `npx prisma validate` passed; `npx prisma generate` passed; `npm run typecheck` passed; `npm run build` passed on Next.js 16.2.5; route/API smoke tests passed for `/channels`, `/channel-explorer`, source detail, attempt detail, combined manifest, English saved search, and UTF-8 Arabic saved search; Playwright Edge screenshot smoke passed for desktop `/channels` and mobile source detail.
- Blocked verification: `npm run lint` still fails because the existing script calls removed `next lint`, which Next treats as invalid project directory `lint`.
- Safety: no migration was created or applied; `db:apply` was not run; `DATABASE_URL` remains the only database URL; `DIRECT_URL` was not restored; no destructive Prisma command, table drop, private Dailymotion access, video download/scrape/rehost behavior, or secret printing was introduced.

## 2026-05-07 - Channel Explorer page-size, combined catalog manifest, provenance, and continue-fetch hardening

- Read the deep-fetch persistence guide, current ledgers/docs, README, env example, Prisma schema/migration, Channel Explorer UI/components, Dailymotion routes/services, manifest repository/types, result-card components, local Next.js 16 docs, and current Dailymotion public API docs before editing.
- Confirmed Dailymotion list requests must stay bounded at `limit=100`. The client/settings/deep-fetch paths now default to page size 100, server-clamp submitted page size to max 100, and persist `page`, `limit`, and date-window request params on page attempts.
- Fixed the key root cause behind the "10 pages fetched / 100 videos collected" risk: older request paths could effectively behave like smaller pages or hide the provider limit. Live public-channel smoke testing now shows a single page can collect 100 videos with `limit=100`; ten full pages can therefore approach 1000 videos subject to Dailymotion availability/caps.
- Added/finished the source catalog manifest behavior: every source can have a durable combined manifest (`query="source-catalog"`) containing all unique collected videos, while each fetch attempt keeps its own attempt manifest/result group. Combined manifest rows dedupe by platform video ID and preserve first-seen provenance.
- Added saved-manifest loading through `GET /api/dailymotion/channel/manifest`, including history and coverage. Fixed URL normalization so pasted `https://...` channel/profile URLs load the same saved source catalog as internal keys like `channel:news`.
- Hardened continuation: "Continue Fetch" / "Fetch Remaining" loads existing source videos, completed windows, and the latest unfinished window/page checkpoint before creating Attempt #N+1. Max-page/max-item stops now save the next auditable page cursor instead of forcing later attempts to replay completed pages.
- Updated Channel Explorer UI with state-aware primary fetch labels (`Start Fetch`, `Continue Fetch`, `Resume Fetch`, `Fetching...`, `Refresh / Re-check Channel`), a separate `Start New Fetch` action, professional progress metrics, result view modes (`Combined Results`, `By Fetch Attempt`, `Current Attempt`), saved-manifest open/export controls, and explicit copy that filters only search saved results.
- Updated result cards to show compact collection provenance: source, attempt number, fetch profile/status, window, API page, collection timestamp, new/duplicate/first-seen status, manifest label/scope, and active view mode.
- Database truth: no schema change was required. Canonical tables remain `video_sources`, `videos`, `manifests`, `manifest_items`, `fetch_jobs`, `fetch_windows`, `fetch_page_attempts`, `source_catalog_snapshots`, and `fetch_job_events`. Rich result-card provenance is stored through existing relations plus `metadataSnapshotJson`; a future migration can add indexed page-attempt columns if operator querying needs it.
- Verification: `npm run db:validate` passed; `npm run db:status` passed and reported schema up to date; `npx prisma validate` passed; `npx prisma generate` passed; `npm run typecheck` passed after clearing stale generated `.next/dev` route types; `npm run build` passed on Next.js 16.2.5. Manual route smoke tests verified `limit=100`, saved DB history, combined manifest loading, card provenance, and continuation cursor behavior.
- Safety: no migration was created or applied; `db:apply` was not run; no `prisma db push`, `migrate reset`, destructive DB command, table drop, private Dailymotion access, video download, stream scraping, rehosting, or `DIRECT_URL` restoration was introduced. Secrets were not intentionally printed.

## 2026-05-07 - Channel Explorer database-backed fetch persistence

- Read the deep-fetch persistence guide, ledgers, README, env example, package manifests, Prisma config/schema/migration, DB scripts, Channel Explorer UI, Dailymotion route/service code, manifest/filter types, stores, local Next.js 16 docs, and current official Prisma/Supabase/Next.js/Vercel docs before editing. Three read-only subagents audited schema/migration state, runtime-memory route ownership, and UI/history/coverage wiring before implementation.
- Migration review result: `prisma/migrations/20260506_channel_deep_fetch_history_persistence_foundation/migration.sql` is non-destructive table/enum/index/FK/RLS creation DDL with no drops, deletes, truncates, or reset behavior. `npm run db:status` reported the configured Supabase database is already up to date, so `db:apply` was not run in this turn.
- Added a server-only Prisma helper using `@prisma/adapter-pg` and `pg`, because Prisma 7 runtime clients require an explicit PostgreSQL driver adapter. The helper uses `DATABASE_URL` only and keeps a small hot-reload-safe global client for route handlers.
- Added `src/lib/repositories/channel-fetch-persistence.ts` as the Channel Explorer persistence layer. It upserts `VideoSource` and `Video`, creates `SourceCatalogSnapshot`, persists temporary `Manifest`/`ManifestItem`, creates/updates `FetchJob`, `FetchWindow`, and `FetchPageAttempt`, and writes lightweight `FetchJobEvent` rows for persisted progress/terminal state without deleting canonical videos, sources, saved videos, or collections.
- Updated Channel Explorer job, metadata, history, coverage, status, next, start, stop, and stop-info routes to use database persistence when `ENABLE_MANIFEST_PERSISTENCE=true`, with runtime-memory fallback and clear `Persistence unavailable` warnings when DB persistence is disabled or blocked.
- Updated `/channel-explorer` UI panels to display database persistence state, temporary/durable badges, resumable checkpoints, reported Dailymotion totals, collected unique public videos, coverage confidence, and the required copy that result filters never trigger provider API requests.
- Verified persistence with live route calls: `https://www.dailymotion.com/user/Isulli282` returned Dailymotion 404 but still persisted source metadata and a failed temporary job; `https://www.dailymotion.com/channel/news` persisted a Quick Preview with 3 videos, a stopped Standard Fetch, history rows, coverage, resume checkpoints, page attempts, manifest items, and resumed successfully after restarting the Next dev server.
- Verification: `npm run db:validate` passed; `npm run db:status` passed and reported schema up to date; `npx prisma validate` passed; `npx prisma generate` passed; `npm run typecheck` passed; `npm run build` passed on Next.js 16.2.5 with the new `prisma generate` pre-build step.
- Blocked verification: `npm run lint` still fails because the existing script calls removed `next lint`; `agent-browser` was not installed, and Playwright's bundled Chromium download timed out, so visual browser verification used `npx playwright screenshot --channel msedge` plus HTTP/API checks rather than the plugin CLI.
- Safety: `DATABASE_URL` remains the only active database URL; `DIRECT_URL` was not restored; no Supabase direct host workflow, `prisma db push`, `prisma migrate reset`, drops, destructive DB commands, `.env` commits, private Dailymotion access, video downloads, scraping, or rehosting were introduced. Secrets were not intentionally printed.

## 2026-05-06 - Audit cleanup, Supabase P1001 hardening, and migration apply

- Fixed the 5 moderate `npm audit` findings without using `npm audit fix --force`. The forced path wanted unsafe downgrades, so the repo now uses narrow overrides for `postcss@8.5.14` and `@hono/node-server@1.19.14`, plus a patch upgrade to `next@16.2.5`.
- Kept `prisma` and `@prisma/client` pinned at `7.8.0`; `prisma@latest` is still `7.8.0`, and the Hono advisory is resolved through the transitive override rather than a Prisma major-line downgrade.
- Added `scripts/prisma-command-env.mjs`. `db:status` and `db:apply` now add `connect_timeout=30` to Prisma CLI child processes only when `DATABASE_URL` has no explicit `connect_timeout`. This fixed the Supabase Session Pooler `P1001` reachability failure without editing the stored DB URL, reintroducing `DIRECT_URL`, or changing the target database.
- Hardened DB scripts so Prisma commands run through the local CLI JS entrypoint with `process.execPath` instead of Windows shell/npx argument concatenation.
- Applied `prisma/migrations/20260506_channel_deep_fetch_history_persistence_foundation/migration.sql` to the configured Supabase Session Pooler target. A second guarded `db:apply` run verified there are no pending migrations.
- Schema audit result: the canonical tables are now `video_sources`, `videos`, `collections`, `saved_videos`, `manifests`, `manifest_items`, `fetch_jobs`, `fetch_windows`, `fetch_page_attempts`, `source_catalog_snapshots`, and `fetch_job_events`. No runtime Prisma client reads/writes were found in `src`, so persistence remains schema-applied but not wired into product repositories.
- Verification: `npm audit` passed with 0 vulnerabilities; script syntax checks passed; `npx prisma validate` passed; `npm run db:validate` passed; `npm run db:status` passed and reported the schema up to date; guarded `npm run db:apply` completed; `npx prisma generate` passed; `npm run typecheck` passed; `npm run build` passed on Next.js 16.2.5.
- Remaining blocked verification: `npm run lint` still fails because the existing script calls removed Next.js 16 command `next lint`, which Next interprets as a project directory named `lint`.
- Safety: no `DIRECT_URL`, Supabase direct host workflow, `prisma db push`, `prisma migrate reset`, drops, or table deletion commands were introduced. Secrets were not intentionally printed.

## 2026-05-06 - Channel Explorer deep fetch, metadata, runtime history, coverage, and Prisma persistence foundation

- Read `Guide-Files/dailymotion_channel_deep_fetch_persistence_guide_2026.md`, current ledgers/docs, Prisma config/schema, DB scripts, Channel Explorer UI, Dailymotion routes/services, manifest/filter types, stores, local Next.js 16 docs, and current official Dailymotion/Prisma/Supabase/Vercel docs before editing.
- Added a server-clamped fetch settings/profile system for `quick-preview`, `standard-fetch`, `deep-balanced`, `deep-aggressive`, `recent-sync`, `historical-backfill`, and `custom-expert`.
- Added Dailymotion public profile metadata support through `POST /api/dailymotion/channel/metadata`, including honest handling of `videos_total` as "Reported total from Dailymotion" rather than a guaranteed catalog total.
- Added route-backed runtime-memory fetch jobs with chunked `jobs/start`, `jobs/next`, `jobs/stop`, `jobs/[id]/status`, `history`, and `coverage` endpoints. This gives real resume checkpoints for the current server runtime session, while clearly not claiming durable DB persistence yet.
- Added a deep time-window fetch service using `created_after` / `created_before`, Dailymotion page-size caps, provider-window cap detection around 1000 results, recursive window splitting, dedupe by Dailymotion video ID, partial manifest preservation, and honest completeness statuses.
- Split Channel Explorer UI into source input, channel metadata, fetch configuration, progress, runtime fetch history, coverage, manifest summary, result filters, active filter chips, and results. Result filters remain manifest-only and never trigger provider fetches.
- Upgraded `prisma/schema.prisma` to a snake_case-mapped Prisma/Postgres foundation with durable `VideoSource`, `Video`, `Collection`, `SavedVideo`, `SourceCatalogSnapshot` and temporary/operational `Manifest`, `ManifestItem`, `FetchJob`, `FetchWindow`, `FetchPageAttempt`, `FetchJobEvent` models.
- Created reviewed migration files under `prisma/migrations/20260506_channel_deep_fetch_history_persistence_foundation/` plus `prisma/migrations/migration_lock.toml`. The migration enables RLS without broad public policies.
- Added deep-fetch env hard caps: `MAX_CHANNEL_FETCH_WINDOWS`, `MAX_CHANNEL_FETCH_WINDOW_DEPTH`, `MAX_CHANNEL_FETCH_TOTAL_PAGES`, `MAX_CHANNEL_FETCH_PAGE_SIZE`, `CHANNEL_FETCH_MIN_DELAY_MS`, `CHANNEL_FETCH_DEFAULT_PROFILE`, `CHANNEL_FETCH_JOB_TTL_HOURS`, and `TEMP_MANIFEST_TTL_HOURS`.
- Preserved the active DB policy: `DATABASE_URL` only, Supabase Session Pooler expected, no `DIRECT_URL`, no Supabase direct host workflow.
- Verification: `npx prisma validate` passed; `npm run typecheck` passed; `npx prisma generate` passed; `npm run db:validate` passed with sanitized output; `npm run db:status` reached migration status and reported the new migration pending; `npm run build` passed; local dev server started on `http://localhost:3000` and `GET /channel-explorer` returned HTTP 200.
- Blocked verification: `npm run lint` is blocked by the pre-existing stale `next lint` script, which is removed in Next.js 16 and currently errors with an invalid `lint` project-directory message. Live Dailymotion API smoke tests from PowerShell were blocked by DNS resolution failure for `api.dailymotion.com`.
- Safety: migration was not applied; `db:apply` was not run; no `prisma migrate reset`, `prisma db push`, drops, or destructive DB commands were run; no secrets were intentionally printed; no downloading, scraping, private/protected Dailymotion access, rehosting, or fabricated video/count behavior was added.

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

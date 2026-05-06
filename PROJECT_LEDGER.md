# Project Ledger

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

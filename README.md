# AI Public Video Discovery Platform

Next.js App Router application for public Dailymotion video metadata discovery and research.

## 2026 upgrade highlights

- Supabase SSR client helpers for browser/server/middleware session handling.
- Prisma datasource migrated from SQLite MVP to Supabase PostgreSQL (`DATABASE_URL` + `DIRECT_URL`).
- New durable relational schema for canonical videos, sources, manifests, manifest items, fetch jobs, and user saved videos.
- Typed environment validation with Zod and fail-fast env parsing.
- Database scripts for generation/migrate/push/studio.

## Safety scope

This platform is **not** a downloader. It does not download/rehost videos, scrape private streams, or bypass platform restrictions.

## Setup

```bash
npm install
cp .env.example .env.local
npm run db:generate
npm run dev
```

## Vercel notes

- Configure all env vars from `.env.example` in Vercel project settings.
- Keep `GEMINI_API_KEY`, `DATABASE_URL`, `DIRECT_URL`, and `SUPABASE_SERVICE_ROLE_KEY` server-only.
- Use resumable fetch batches for large channels; avoid one long-running serverless request.

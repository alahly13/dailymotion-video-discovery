# AI Public Video Discovery Platform

A Next.js 16 App Router MVP for public Dailymotion video metadata discovery. The core feature is the Dailymotion Channel Explorer: enter a public channel URL, profile URL, username, or channel ID; fetch public metadata; build a Channel Manifest; and apply advanced filters locally to the current manifest only.

This project is **not** a video downloader. It does not download, rehost, scrape private streams, bypass restrictions, fabricate videos, or expose server-only API keys.

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Key safety defaults

- Fetch All uses Dailymotion public API pagination only.
- Server-only env variables include `GEMINI_API_KEY`, `DATABASE_URL`, and `DAILYMOTION_API_BASE_URL`.
- `NEXT_PUBLIC_APP_URL` is the only browser-safe env variable in the MVP.
- Filters are pure utilities and treat numeric zero values as valid metadata.

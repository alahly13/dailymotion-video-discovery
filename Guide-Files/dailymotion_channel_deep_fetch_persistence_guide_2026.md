# Dailymotion Discovery — Deep Channel Fetch, History, Resume, Coverage, and Persistence Guide 2026

> **Purpose:** This guide is a technical reference for AI agents and developers working on the `dailymotion-video-discovery` project. It explains how to build a professional, resumable, database-aware Dailymotion Channel Explorer system that separates fetch configuration from result filtering, tracks fetch history, reports channel coverage, and distinguishes temporary operational data from permanent durable data.
>
> **Recommended location in the repo:** `Guide-Files/dailymotion_channel_deep_fetch_persistence_guide_2026.md`
>
> **Default agent model request:** Codex GPT-5.5 Pro — Extra High Reasoning Mode, or the latest available 2026 coding model.

---

## 0. Required Opening Instruction for Any AI Agent

Every serious implementation prompt for this system should start with:

```text
Use the latest available 2026 coding model for this task, preferably Codex GPT-5.5 Pro in Extra High Reasoning Mode. Spawn multiple subagents to explore this repo before implementation.
```

For smaller tasks:

```text
Use the latest available 2026 coding model for this task. Analyze the current codebase first before making any changes.
```

---

## 1. Project Identity

**Project:** AI Public Video Discovery Platform / Dailymotion Discovery

**Core mission:**

Build a professional AI-powered public video metadata discovery platform focused on Dailymotion first, with future multi-platform support. The platform discovers, organizes, filters, persists, and summarizes public video metadata. It must not download, rehost, scrape private streams, bypass platform protections, or fabricate AI video results.

**Current strategic direction:**

The Channel Explorer should evolve from a simple one-shot fetch UI into a professional catalog collection workspace with:

- Smart fetch profiles
- Deep time-window fetching
- Fetch history
- Resume checkpoints
- Channel metadata and reported catalog total
- Coverage status and confidence
- Temporary manifests and jobs
- Permanent saved library foundations
- Strong Prisma/PostgreSQL migration design

**Implementation status as of 2026-05-07:**

- The `20260506_channel_deep_fetch_history_persistence_foundation` migration is applied in the configured Supabase/Postgres target used by this workspace.
- Channel Explorer route handlers now use a centralized Prisma/`@prisma/adapter-pg` persistence layer when `ENABLE_MANIFEST_PERSISTENCE=true`.
- Fetch history, resume checkpoints, windows, page attempts, manifests, manifest items, source metadata, catalog snapshots, and canonical videos are written to the database.
- Runtime memory remains a fallback only when persistence is disabled or unavailable; the UI must show the persistence warning in that case.
- The current implementation preserves the existing chunked route model instead of replacing it with a background worker.
- `/channels`, `/channels/[sourceId]`, and `/channels/[sourceId]/attempts/[attemptId]` are now the saved-channel browser, combined catalog view, and attempt detail view. They are dynamic pages because they read Prisma-backed saved state.
- Saved-result search now has two layers: a database-backed API for persisted manifest rows and a FlexSearch index over the currently loaded browser result page. Search must remain saved-data-only and must not call Dailymotion.
- `GEMINI_MODEL` is available as an optional server-only model override; `GEMINI_API_KEY` and `GEMINI_MODEL` must never be mirrored into `NEXT_PUBLIC_*`.

---

## 2. Non-Negotiable Rules

```text
Do not rebuild from scratch.
Do not redesign unrelated architecture.
Do not change unrelated areas.
Do not remove working features.
Do not remove guards, fallbacks, normalization helpers, or defensive code without proof.
Do not expose secrets.
Do not move backend authority into the frontend.
Do not fabricate video metadata, URLs, counts, IDs, or coverage claims.
Do not add downloading, stream scraping, rehosting, or bypass behavior.
Do not make DAILYMOTION_API_KEY required for public metadata fetching.
Do not restore DIRECT_URL.
Do not use Supabase direct host as the active database workflow.
Do not run prisma migrate reset.
Do not run prisma db push as the production path.
Do not run db:apply unless the user explicitly confirms it.
```

Prefer:

```text
repair → reconnect → harden → extend → refine
```

Not:

```text
delete → replace → rebuild
```

---

## 3. Repo-First Workflow

Before editing anything, inspect the current codebase. The real repo is the source of truth.

Read first:

```text
dailymotion_discovery_ledger.md
PROJECT_LEDGER.md
README.md
.env.example
package.json
package-lock.json
prisma.config.ts
prisma/schema.prisma
prisma/migrations/ if it exists
scripts/db-status.mjs
scripts/db-validate-env.mjs
scripts/db-apply.mjs
src/app/channel-explorer/page.tsx
src/components/channel-explorer/
src/components/filters/
src/app/api/dailymotion/channel/
src/app/api/dailymotion/search/route.ts
src/lib/platforms/dailymotion/
src/lib/manifests/
src/lib/filters/
src/lib/config/env.ts
src/types/
src/stores/
```

Also inspect repo-local skills if present:

```text
.agents/skills/supabase/SKILL.md
.agents/skills/supabase-postgres-best-practices/SKILL.md
skills-lock.json
```

If the ledger and the code disagree, trust the current code and document the mismatch.

---

## 4. Official Documentation to Verify Before Implementation

The agent must verify current official docs before changing version-sensitive behavior.

Check official sources for:

- Dailymotion large catalog browsing and the 1000-result-per-window limitation
- Dailymotion `created_after` and `created_before` filters
- Dailymotion pagination `limit` and `page` behavior
- Dailymotion user/profile metadata fields such as `videos_total`
- Dailymotion public metadata vs authenticated/private/protected operations
- Prisma 7 migrations and `prisma.config.ts`
- Supabase PostgreSQL + Prisma usage
- Next.js 16 App Router route handlers and runtime behavior
- Vercel request timeout/runtime limitations

### Current Dailymotion assumptions to verify

The system design is based on these official-doc-backed assumptions, but the agent must re-check them before implementation:

1. Dailymotion API may cap a single result window/query around 1000 results.
2. `limit=100` is the maximum page size for video list queries.
3. `page` may be capped at 10 when `limit=100`.
4. Large catalogs must be browsed by splitting queries into time windows using filters such as `created_after` and `created_before`.
5. Public metadata fetching should not require making `DAILYMOTION_API_KEY` mandatory.
6. Auth/API keys/OAuth scopes are needed for protected/private actions, uploads, updates, webhooks, and other privileged operations.
7. User/profile metadata can expose fields such as `videos_total` when requested.

---

## 5. Beginner Glossary

### API Page

An **API page** is not a web page. It is one batch of results returned by Dailymotion.

Example:

```text
page=1&limit=100 → first 100 videos
page=2&limit=100 → videos 101–200
page=3&limit=100 → videos 201–300
```

### Limit

`limit` is how many items to return in one API page. For Dailymotion video list endpoints, the expected safe maximum is `100`.

### Window

A **window** is a time range.

Example:

```text
2026-01-01 → 2026-12-31
2025-01-01 → 2025-12-31
2024-01-01 → 2024-12-31
```

Inside each window, the app fetches API pages.

### Deep Fetch

A **Deep Fetch** breaks a large channel into many time windows, then fetches pages inside each window.

```text
Channel
 ├── 2026 window
 │    ├── page 1
 │    ├── page 2
 │    └── page 10
 ├── 2025 window
 │    ├── page 1
 │    └── page 10
 └── 2024 window
      ├── page 1
      └── page 10
```

### Manifest

A **manifest** is the app's working result set. It contains videos collected from a search or channel fetch.

### Fetch Job / Fetch Run

A **FetchJob** or **FetchRun** is one operation that collects metadata from Dailymotion. It should track progress, status, windows, pages, errors, and resume checkpoints.

### Coverage

**Coverage** tells the user how much of the channel's public catalog the app appears to have collected.

Coverage must be honest. The app must not claim full coverage unless all planned windows completed without caps, failures, stops, or max-limit interruptions.

---

## 6. Core Architecture Separation

The system must separate four concepts.

### 6.1 Fetch Configuration

Fetch Configuration controls **how metadata is collected from Dailymotion API**.

Examples:

- Fetch profile
- Max videos to collect
- Max total API pages
- Max windows
- Page size
- Date range
- Initial window unit
- Minimum split unit
- Auto-split capped windows
- Delay between requests
- Stop on cap
- Preserve partial manifest
- Resume from previous job

Changing fetch settings must not automatically mutate or refetch the current manifest. A fetch starts only when the user explicitly clicks a fetch action.

### 6.2 Result Filters

Result Filters control **how already-collected manifest items are filtered and sorted**.

Examples:

- Keyword
- Views min/max
- Duration min/max
- Year/date
- Language
- Channel/owner
- Has thumbnail
- Has description
- Sort order

Rules:

```text
Result filters must never trigger a Dailymotion API request automatically.
Result filters must only apply to the current manifest.
Changing result filters must not mutate original manifest items.
Filter first, sort second, render third.
Treat numeric 0 as valid metadata.
```

### 6.3 Temporary Working Data

Temporary working data is short-lived operational data used to manage fetches.

Examples:

- Fetch jobs
- Fetch windows
- API page attempts
- Partial manifests
- Temporary search manifests
- Resume cursors
- Progress JSON
- Error JSON
- Coverage snapshots

Temporary data may expire after a TTL, but should not be deleted immediately after failure because it may be needed for resume/debug.

### 6.4 Permanent Durable Data

Permanent durable data is long-lived user/library or canonical metadata.

Examples:

- Canonical video records
- Canonical video source/channel records
- Saved videos
- Collections
- User notes
- Tags
- Durable library records

Permanent data must not expire automatically just because a temporary fetch job expires.

---

## 7. What Needs a Database vs What Does Not

| Feature / Data | Needs database? | Why |
| --- | --- | --- |
| Source input text typed by the user before fetch | No | Temporary UI state only. |
| Result filters currently applied to a manifest | Usually no | Can live in client state unless saved filter presets are added. |
| Fetch configuration draft before the user starts | No | UI state until submitted. |
| A running fetch job | Yes, if resume/history is required | Needed for checkpointing, progress, resume, and audit. |
| Fetch windows and page attempts | Yes, for professional resume/history | Needed to know exactly where to continue. |
| Partial manifest | Yes, if persistence/resume is enabled | Needed to preserve collected items after stop/failure/refresh. |
| Canonical video metadata | Yes | Avoid duplicates and support saved library/search later. |
| Channel/source metadata | Yes | Needed for reported totals, source identity, history, and coverage. |
| Channel coverage snapshots | Yes | Needed to compare total vs collected over time. |
| Saved videos / favorites | Yes | Durable user/library data. |
| Collections and notes | Yes | Durable user/library data. |
| Hover preview open/closed UI state | No | Client-only interaction. |
| Loading spinners and current form errors | No | Client-only interaction. |
| AI prompt input draft | No | Unless AI conversation history is implemented. |
| AI summaries of a manifest | Optional | Use DB only if summaries must be saved/reopened. |
| Temp manifest expiration queue | Yes if persistence enabled | Needed for cleanup and TTL policy. |

---

## 8. Fetch Profiles

Implement fetch profiles as presets that resolve into validated fetch settings.

### 8.1 Quick Preview

Purpose: validate the source quickly.

Behavior:

- Fetch exactly one API page.
- Use a safe page size.
- Do not create a long-running deep job unless persistence architecture requires a small job record.
- Good for checking that input analysis and Dailymotion response work.

### 8.2 Standard Fetch

Purpose: fetch regular paginated results from one result window.

Behavior:

- Fetch pages from the regular endpoint.
- May stop around 1000 results due to Dailymotion API limits.
- Must explain that this is not guaranteed to collect the whole channel.

### 8.3 Deep Balanced

Purpose: practical deep fetch for most large channels.

Behavior:

- Use time-window fetching.
- Start with yearly windows.
- If a year reaches the provider cap, split into months.
- Preserve partial manifests.
- Deduplicate by video ID.

### 8.4 Deep Aggressive

Purpose: large channels with dense upload history.

Behavior:

- Use recursive time-window splitting.
- Allow year → month → week → day depending on configured depth.
- Split capped windows automatically.
- Respect max windows/pages/items.

### 8.5 Recent Sync

Purpose: update an already-fetched channel.

Behavior:

- Fetch only recent periods: last 24 hours, last 7 days, last 30 days, or a custom recent range.
- Useful when the channel was previously backfilled.

### 8.6 Historical Backfill

Purpose: fetch older history.

Behavior:

- Fetch between selected historical dates.
- Useful for progressively collecting old channel content.

### 8.7 Custom Expert Mode

Purpose: maximum user control.

Expose manual controls:

- Max videos to collect
- Max total API pages
- Max time windows
- Page size
- From date
- To date
- Initial window unit: year/month/week/day
- Minimum split unit: month/week/day
- Auto-split capped windows
- Delay between requests
- Stop when max items reached
- Stop on capped window
- Preserve partial manifest
- Resume from previous job if available

---

## 9. Environment Variables and Server Hard Caps

Existing environment context:

```env
ENABLE_PGVECTOR="false"
ENABLE_MANIFEST_PERSISTENCE="true"
MAX_CHANNEL_FETCH_PAGES="200"
MAX_CHANNEL_FETCH_ITEMS="10000"
CHANNEL_FETCH_DELAY_MS="250"
```

Recommended expanded config:

```env
# Feature flags
ENABLE_MANIFEST_PERSISTENCE="true"
ENABLE_PGVECTOR="false"

# Deep channel fetch safety caps
MAX_CHANNEL_FETCH_ITEMS="100000"
MAX_CHANNEL_FETCH_TOTAL_PAGES="5000"
MAX_CHANNEL_FETCH_WINDOWS="3000"
MAX_CHANNEL_FETCH_WINDOW_DEPTH="5"
MAX_CHANNEL_FETCH_PAGE_SIZE="100"
MAX_CHANNEL_FETCH_PAGES="200"
CHANNEL_FETCH_DELAY_MS="250"
CHANNEL_FETCH_MIN_DELAY_MS="100"
CHANNEL_FETCH_DEFAULT_PROFILE="deep-balanced"

# Temporary operational retention
CHANNEL_FETCH_JOB_TTL_HOURS="72"
TEMP_MANIFEST_TTL_HOURS="72"
```

Rules:

```text
These are server-side hard caps.
UI-selected values must be clamped against server caps.
Never allow unlimited fetches.
Do not let the browser bypass server-side caps.
Use Zod or equivalent validation for submitted settings.
Keep existing MAX_CHANNEL_FETCH_PAGES for backward compatibility, but document its meaning.
High max values are allowed, but must be bounded.
```

Important distinction:

- Dailymotion `page` limit applies inside one result window.
- `MAX_CHANNEL_FETCH_TOTAL_PAGES` is the total number of API pages across all windows.
- `MAX_CHANNEL_FETCH_WINDOWS` is the max number of date windows the job may process.

---

## 10. Channel Metadata and Reported Catalog Count

The user needs the app to know how many videos/content items a channel appears to have, when Dailymotion exposes this.

### Goal

Before and during fetch operations, the system should fetch, store, and display channel/source metadata.

Use honest labels:

```text
Reported total from Dailymotion
Collected unique public videos
Estimated remaining
Coverage estimate
Coverage confidence
```

Do not use misleading labels:

```text
Do not say "all videos" unless proven.
Do not say "total channel videos fetched" unless the fetch is complete.
Do not claim reportedTotalFromApi equals all accessible public videos unless verified.
```

### Metadata to request and normalize

For a Dailymotion user/profile/channel source, request available fields such as:

- id
- username
- screenname
- url
- description
- avatar/thumbnail fields if available
- country
- language
- videos_total

Treat `videos_total` as a reported API value, not an absolute guarantee.

### Channel Metadata Panel

Show:

- Channel/profile ID
- Username/handle
- Display name/screenname
- Canonical URL
- Avatar/thumbnail if available
- Language/country if available
- Reported total from Dailymotion, if available
- Collected unique public videos
- Estimated remaining videos, only when reported total is available
- Coverage estimate, only when reported total is available
- Coverage confidence
- Last metadata refresh time
- Refresh Metadata button

Required UI note:

```text
Reported total depends on what Dailymotion exposes for this public profile. It may change over time and may not exactly match videos currently collectable through public API windows.
```

---

## 11. Fetch History, Resume, and Coverage System

A large channel must be treated as a resumable catalog collection process.

```text
First run may collect 1000 public videos.
Next run continues from the next planned time window/page.
Later runs keep filling gaps.
The system shows which parts are complete, capped, failed, skipped, pending, or stopped.
```

### Required history behavior

1. Every fetch operation creates or updates a FetchJob / FetchRun history record.
2. Every time-window fetch is tracked separately.
3. Every API page request is tracked enough for audit/resume.
4. The user can see previous fetch runs for the same channel/source.
5. The user can resume a stopped/failed/partial fetch from the last safe checkpoint.
6. The system must not start from zero unless the user explicitly starts a new fetch/reset.
7. The system deduplicates videos across all runs by platform video ID.
8. The system preserves partial results and progress.
9. The UI shows whether the catalog state is complete, partial, capped, failed, stopped, or max-items-limited.

### Fetch History Panel

Show:

- Previous fetch runs
- Fetch profile used
- Start/completion time
- Status
- Unique videos collected
- Pages fetched
- Windows completed/capped/failed
- Resume availability
- Resume button
- View Manifest button
- Start New Fetch button
- Clear expired temporary history button

Important: clearing expired temporary history must not delete canonical videos or saved library records.

### Channel Coverage Panel

Show:

- Reported total from API, if available
- Collected unique videos
- Estimated remaining, if total is available
- Coverage percent, if total is available
- Coverage confidence
- Capped windows
- Failed windows
- Pending windows
- Last successful checkpoint
- Clear warning when full coverage is not guaranteed

Required UI copy:

```text
History tracks fetch runs and resume checkpoints. Result filters only filter the current collected manifest.
```

```text
Reported total depends on what Dailymotion exposes for this endpoint. If unavailable, the app shows collected unique videos and coverage status instead.
```

```text
Full channel coverage is only confirmed when every planned time window completes without caps or failures.
```

---

## 12. Coverage Status and Honesty Rules

### Coverage fields

Track:

- reportedTotalFromApi
- reportedTotalSource
- reportedTotalCheckedAt
- collectedUniqueVideos
- duplicateCount
- totalFetchRuns
- totalWindowsPlanned
- totalWindowsCompleted
- totalWindowsPending
- cappedWindowCount
- failedWindowCount
- stoppedWindowCount
- latestSuccessfulFetchAt
- lastResumePoint
- coverageStatus
- coveragePercent
- coverageConfidence

### CoverageStatus enum

Recommended values:

```text
unknown
partial
complete
capped
failed
stopped
max_items_reached
provider_limited
timeout_limited
auth_or_provider_limited
expired
```

### CoverageConfidence enum

Recommended values:

```text
high
medium
low
unknown
```

### Full coverage rule

The app can only show **Complete coverage** when all of these are true:

```text
All planned windows completed.
No window is capped.
No window failed.
No window was stopped.
Max item/page/window caps were not hit.
Provider did not indicate more results for final windows.
Dedupe completed successfully.
Collected count reasonably matches reported total when reported total is available.
```

If any uncertainty remains, show:

```text
Partial / Unknown coverage
```

### If reported total is unavailable

Show:

```text
Reported total: unavailable
Collected unique public videos: <count>
Coverage status: based on windows/failures/caps only
Coverage percent: unavailable
```

Never fabricate a total.

---

## 13. Deep Fetch Algorithm

### Normal pagination inside one window

For each window:

```text
page = 1
while page <= providerPageMax and caps not reached:
  request videos with:
    limit=100
    page=<page>
    created_after=<windowStart>
    created_before=<windowEnd>
  normalize results
  upsert videos
  dedupe by platformVideoId
  create manifest items
  track FetchPageAttempt
  if has_more is false: stop this window
  page += 1
```

### Cap detection

A window is likely capped when:

- It returns the maximum provider-visible results for one window, or
- It reaches max page count with `has_more=true`, or
- Dailymotion indicates more results exist but page cannot continue.

### Recursive window splitting

```text
if window is capped and autoSplit is enabled:
  if current unit can be split further:
    mark parent window as split/capped
    create child windows
    process child windows
  else:
    mark window capped/incomplete
```

Example split path:

```text
year → month → week → day
```

### Resume algorithm

When user clicks Resume:

1. Load latest resumable FetchJob for the source.
2. Load queued/running/failed/stopped windows that still need work.
3. Start from `resumeCursorJson` if available.
4. Continue from `nextPageToFetch` inside the current window.
5. If a window was capped and auto-split is enabled, split it into child windows.
6. Do not refetch completed windows unless the user explicitly chooses refresh.
7. Upsert videos by platformVideoId.
8. Add ManifestItems only if not already present.
9. Update coverage summary after every completed/stopped/failed window.

---

## 14. Prisma / PostgreSQL Data Model Plan

The migration must distinguish temporary operational data from permanent durable data.

### 14.1 Enums

Recommended enums:

```prisma
enum Platform {
  DAILYMOTION
  YOUTUBE
  VK
  REDDIT
  OTHER
}

enum SourceType {
  CHANNEL
  PROFILE
  USER
  OWNER
  SEARCH_OWNER
  PLAYLIST
  UNKNOWN
}

enum PersistenceType {
  TEMPORARY
  DURABLE
}

enum ManifestType {
  CHANNEL
  SEARCH
  DEEP_CHANNEL
  RECENT_SYNC
  HISTORICAL_BACKFILL
  CUSTOM
}

enum FetchJobType {
  CHANNEL_FETCH
  DEEP_CHANNEL_FETCH
  SEARCH_FETCH
  RECENT_SYNC
  HISTORICAL_BACKFILL
  CUSTOM
}

enum FetchProfile {
  QUICK_PREVIEW
  STANDARD_FETCH
  DEEP_BALANCED
  DEEP_AGGRESSIVE
  RECENT_SYNC
  HISTORICAL_BACKFILL
  CUSTOM_EXPERT
}

enum OperationalStatus {
  DRAFT
  QUEUED
  RUNNING
  PAUSED
  STOPPED
  COMPLETE
  PARTIAL
  CAPPED
  FAILED
  MAX_ITEMS_REACHED
  TIMEOUT_LIMITED
  AUTH_OR_PROVIDER_LIMITED
  EXPIRED
}

enum FetchWindowStatus {
  QUEUED
  RUNNING
  COMPLETE
  CAPPED
  SPLIT
  FAILED
  SKIPPED
  STOPPED
}

enum FetchWindowUnit {
  YEAR
  MONTH
  WEEK
  DAY
  CUSTOM
}

enum FetchPageStatus {
  QUEUED
  RUNNING
  COMPLETE
  FAILED
  SKIPPED
}

enum CoverageStatus {
  UNKNOWN
  PARTIAL
  COMPLETE
  CAPPED
  FAILED
  STOPPED
  MAX_ITEMS_REACHED
  PROVIDER_LIMITED
  TIMEOUT_LIMITED
  AUTH_OR_PROVIDER_LIMITED
}

enum CoverageConfidence {
  HIGH
  MEDIUM
  LOW
  UNKNOWN
}
```

The agent may adapt names to the current schema style, but must avoid duplicate parallel concepts.

---

## 15. Permanent Canonical Models

### 15.1 VideoSource

Purpose: durable source/channel/profile identity.

Recommended fields:

```text
id
platform
externalSourceId
sourceType
handle
username
displayName
canonicalUrl
thumbnailUrl / avatarUrl
description
country
language
reportedTotalFromApi nullable
reportedTotalFieldName nullable, e.g. videos_total
reportedTotalCheckedAt nullable
metadataJson
firstSeenAt
lastFetchedAt
lastMetadataRefreshAt
createdAt
updatedAt
```

Constraints/indexes:

```text
unique(platform, externalSourceId, sourceType)
index(platform, sourceType)
index(lastFetchedAt)
```

### 15.2 Video

Purpose: durable normalized public video metadata.

Recommended fields:

```text
id
platform
platformVideoId
sourceId nullable
url
title
description
thumbnailUrl
durationSeconds
viewsCount
language
ownerId / ownerName
publishedAt
rawJson
firstSeenAt
lastSeenAt
createdAt
updatedAt
```

Constraints/indexes:

```text
unique(platform, platformVideoId)
index(sourceId, publishedAt)
index(platform, publishedAt)
index(viewsCount)
```

### 15.3 Collection

Purpose: durable saved-library grouping.

Recommended fields:

```text
id
ownerId nullable until auth is finalized
name
description
createdAt
updatedAt
```

### 15.4 SavedVideo

Purpose: durable saved/favorite video reference.

Recommended fields:

```text
id
ownerId nullable until auth is finalized
videoId
collectionId nullable
notes
tags
createdAt
updatedAt
```

Constraints/indexes:

```text
unique(ownerId, videoId, collectionId) if owner scope exists
index(videoId)
index(collectionId)
```

---

## 16. Temporary / Operational Models

### 16.1 Manifest

Purpose: collected working set for search/channel/deep fetch.

Recommended fields:

```text
id
manifestType
persistenceType
platform
sourceId nullable
sourceInput
fetchJobId nullable
status
completenessStatus
itemCount
uniqueItemCount
duplicateCount
totalPagesFetched
totalWindowsProcessed
cappedWindowCount
failedWindowCount
fetchSettingsJson
filtersSnapshotJson nullable
expiresAt nullable
createdAt
updatedAt
completedAt nullable
```

Rules:

- Temporary manifests must have `expiresAt`.
- Durable manifests may have `expiresAt = null`.
- Do not delete canonical videos when a temporary manifest expires.

### 16.2 ManifestItem

Purpose: join manifest to videos with position and context.

Recommended fields:

```text
id
manifestId
videoId
position
windowId nullable
pageNumber nullable
firstSeenInManifestAt
metadataSnapshotJson nullable
createdAt
```

Constraints/indexes:

```text
unique(manifestId, videoId)
index(manifestId, position)
index(videoId)
```

### 16.3 FetchJob / FetchRun

Purpose: resumable fetch operation.

Recommended fields:

```text
id
jobType
platform
sourceId nullable
sourceInput
manifestId nullable
status
fetchProfile
settingsJson
progressJson
errorJson nullable
resumeCursorJson nullable
currentWindowId nullable
currentPage nullable
lastCompletedWindowId nullable
maxItems
maxPages
maxWindows
pagesFetched
windowsProcessed
itemsCollected
uniqueItemsCollected
duplicateCount
cappedWindowCount
failedWindowCount
sourceReportedTotalAtStart nullable
sourceReportedTotalAtEnd nullable
collectedUniqueAtStart
collectedUniqueAtEnd
coverageStatusAtStart
coverageStatusAtEnd
resumable
stoppedAt nullable
expiresAt nullable
startedAt nullable
completedAt nullable
createdAt
updatedAt
```

Indexes:

```text
index(sourceId, status, updatedAt)
index(status, expiresAt)
index(fetchProfile)
```

### 16.4 FetchWindow

Purpose: one time range inside a fetch job.

Recommended fields:

```text
id
fetchJobId
sourceId
parentWindowId nullable
status
windowStart
windowEnd
unit
depth
pageStart
nextPageToFetch
pagesFetched
itemsFound
uniqueItemsAdded
duplicateItemsFound
reachedProviderCap
hasMoreAtEnd nullable
reportedTotalInWindow nullable
errorJson nullable
startedAt nullable
completedAt nullable
createdAt
updatedAt
```

Indexes:

```text
index(fetchJobId, status, windowStart, windowEnd)
index(sourceId, status, windowStart)
index(parentWindowId)
```

### 16.5 FetchPageAttempt

Purpose: audit each API page request.

Recommended fields:

```text
id
fetchWindowId
fetchJobId
pageNumber
limit
requestParamsJson
status
itemsReturned
uniqueItemsAdded
duplicateItemsFound
hasMore
providerErrorCode nullable
errorJson nullable
requestedAt
completedAt nullable
```

Indexes:

```text
index(fetchJobId, fetchWindowId, pageNumber)
index(fetchWindowId, status)
```

### 16.6 SourceCatalogSnapshot

Purpose: store reported channel total and coverage snapshot over time.

Recommended fields:

```text
id
sourceId
platform
reportedTotalFromApi nullable
reportedTotalFieldName nullable
reportedTotalRawJson nullable
collectedUniqueVideos
estimatedRemainingVideos nullable
coveragePercent nullable
coverageStatus
coverageConfidence
cappedWindowCount
failedWindowCount
completedWindowCount
pendingWindowCount
lastCheckedAt
createdAt
```

Indexes:

```text
index(sourceId, lastCheckedAt)
index(coverageStatus)
```

### 16.7 FetchJobEvent Optional

Purpose: lightweight audit log.

Recommended fields:

```text
id
fetchJobId
eventType
message
dataJson nullable
createdAt
```

Use only if useful. Do not add noisy event storage without a reason.

---

## 17. Migration Requirements

Before schema edits:

```text
Inspect current prisma/schema.prisma.
Inspect existing migrations if any.
Identify existing canonical models.
Avoid duplicate parallel tables.
Upgrade existing models carefully.
Use enums for statuses/types where appropriate.
Add indexes and unique constraints.
Use JSON fields for flexible provider metadata only where useful.
Keep normalized fields queryable.
```

Suggested migration name:

```text
20260506_channel_deep_fetch_persistence_foundation
```

If no migration history exists:

- Create a reviewed baseline migration strategy.
- Generate migration files if possible.
- Do not apply migrations unless the user explicitly confirms.
- Do not pretend migrations were applied if DB credentials fail.
- Keep `db:apply` fail-closed if migration files are missing.

Commands to avoid:

```text
prisma migrate reset
prisma db push as production path
db:apply without explicit confirmation
drop table
```

Verification when migration files are created:

```bash
npx prisma validate
npx prisma generate
npm run typecheck
npm run build
```

If DB credentials are valid and user approves:

```bash
CONFIRM_DB_APPLY=true npm run db:apply
```

Do not run that command by default.

---

## 18. Backend Implementation Plan

### 18.1 Add typed fetch settings

Create or refine a schema for fetch settings.

Fields:

```text
fetchProfile
maxItems
maxTotalPages
maxWindows
pageSize
fromDate
toDate
initialWindowUnit
minimumSplitUnit
autoSplitCappedWindows
delayMs
stopWhenMaxItemsReached
stopOnCappedWindow
preservePartialManifest
resumeJobId optional
```

Validate and clamp all user values server-side.

### 18.2 Add fetch profile resolver

A resolver converts a profile into concrete fetch settings.

Example:

```text
DEEP_BALANCED → yearly windows, month split, preserve partial, moderate caps
DEEP_AGGRESSIVE → recursive year/month/week/day split, higher caps
QUICK_PREVIEW → one page only
```

### 18.3 Add time-window helpers

Helpers should:

- Generate yearly/monthly/weekly/daily windows.
- Split a capped parent window into smaller child windows.
- Respect max window depth.
- Avoid overlapping or missing time ranges.
- Keep timestamps consistent with Dailymotion expectations.

### 18.4 Add dedupe helpers

Dedupe by normalized platform video ID.

Rules:

```text
Upsert Video by platform + platformVideoId.
Add ManifestItem only if manifestId + videoId does not already exist.
Track duplicateCount.
Do not treat duplicate as failure.
```

### 18.5 Add completeness calculator

Calculate status from:

- planned windows
- completed windows
- capped windows
- failed windows
- stopped windows
- max item/page/window caps
- provider `has_more`
- reported total if available

### 18.6 Add persistence repository/service layer

If runtime persistence is implemented, keep DB logic centralized.

Suggested service modules:

```text
src/lib/repositories/video-source-repository.ts
src/lib/repositories/video-repository.ts
src/lib/repositories/manifest-repository.ts
src/lib/repositories/fetch-job-repository.ts
src/lib/services/channel-metadata-service.ts
src/lib/services/channel-deep-fetch-service.ts
src/lib/services/channel-coverage-service.ts
```

Do not scatter Prisma calls randomly across UI components.

---

## 19. API Route Design

Keep existing routes working:

```text
POST /api/dailymotion/channel/analyze
POST /api/dailymotion/channel/fetch
POST /api/dailymotion/channel/fetch-all
POST /api/dailymotion/channel/stop-fetch
POST /api/dailymotion/search
```

Add or extend routes only if they fit the current architecture.

Possible routes:

```text
POST /api/dailymotion/channel/metadata
POST /api/dailymotion/channel/jobs/start
POST /api/dailymotion/channel/jobs/next
POST /api/dailymotion/channel/jobs/stop
GET  /api/dailymotion/channel/jobs/[id]/status
GET  /api/dailymotion/channel/history?sourceId=...
GET  /api/dailymotion/channel/coverage?sourceId=...
```

### Client-orchestrated chunk fetching

For Vercel/timeout safety, prefer chunked operations when a deep fetch may be large.

One request should process a safe chunk, such as:

```text
one page
or one window
or a small number of pages/windows
```

Then return updated progress and the next cursor.

### Persistent jobs

If persistence is wired:

1. `jobs/start` creates FetchJob, Manifest, initial FetchWindows.
2. `jobs/next` processes next window/page chunk.
3. `jobs/status` returns current job/progress/coverage.
4. `jobs/stop` marks job stopped and resumable.
5. `Resume` continues using stored windows/cursors.

Do not create fake resume UI if persistence is not actually implemented.

---

## 20. UI Implementation Plan

### 20.1 Page layout order

Recommended Channel Explorer layout:

```text
1. Source Input / Analyze
2. Channel Metadata panel
3. Fetch Configuration panel
4. Fetch Progress panel
5. Channel Coverage panel
6. Fetch History panel
7. Manifest Summary
8. Result Filters panel
9. Active Filter Chips
10. Results Grid
```

### 20.2 Fetch Configuration panel

Show:

- Fetch profile selector
- Max videos
- Max total API pages
- Max windows
- Date range
- Page size
- Window strategy
- Auto-split toggle
- Delay
- Preserve partial manifest toggle
- Resume option if available

Required copy:

```text
Fetch settings control how public metadata is collected from Dailymotion. Result filters only filter videos already collected in the current manifest.
```

### 20.3 Result Filters panel

Keep separate from fetch configuration.

Show:

- Keyword
- Views min/max
- Duration min/max
- Year/date
- Language
- Channel/owner
- Has thumbnail
- Has description
- Sort order

No filter change may trigger a Dailymotion API request automatically.

### 20.4 Progress UI

Show:

- Fetch profile
- Fetch mode
- Videos collected
- Unique videos after dedupe
- Duplicate count
- Pages fetched
- Total API requests
- Windows processed
- Windows queued
- Capped windows
- Failed windows
- Current date window
- Max items reached or not
- Partial manifest preserved or not
- Resume availability
- Complete/partial/capped/stopped/failed status

### 20.5 Warnings

Required warning:

```text
Dailymotion can cap a single result window around 1000 videos. Deep Fetch splits public metadata by date windows when supported.
```

### 20.6 Responsive and theme requirements

- Keep UI clean in dark and light mode.
- Avoid clutter in Custom Expert Mode.
- Hide advanced controls behind an expandable panel if needed.
- Keep mobile controls stacked and readable.

---

## 21. Persistence/Resume Decision Matrix

| Scenario | Correct behavior |
| --- | --- |
| `ENABLE_MANIFEST_PERSISTENCE=true` and DB persistence is implemented | Save FetchJob, FetchWindow, FetchPageAttempt, Manifest, ManifestItem, VideoSource, Video. Enable resume. |
| `ENABLE_MANIFEST_PERSISTENCE=true` but DB auth fails | Do not claim persistence works. Keep in-memory partial results and document blocked DB verification. |
| Persistence schema exists but runtime not wired | Show schema-ready status in docs/ledger, but do not show fake resume. |
| User stops fetch | Mark job stopped/resumable if DB persistence exists; preserve current manifest either way. |
| A window fails | Store error, keep successful prior items, allow resume/retry if possible. |
| A window is capped and can split | Create child windows and continue. |
| Minimum split unit reached and still capped | Mark capped/incomplete; do not claim full coverage. |
| Temporary history expires | It may be cleaned later, but must not delete canonical videos or saved videos. |

---

## 22. Security and Safety

```text
Public metadata only.
No downloading.
No stream scraping.
No rehosting.
No private data access.
No fabricated AI results.
DAILYMOTION_API_KEY remains optional and server-only.
GEMINI_API_KEY remains server-only.
DATABASE_URL remains server-only.
Do not expose secrets in logs, docs, UI, or client bundles.
```

If a Dailymotion API key is present:

- Use it server-side only.
- Do not assume it removes the 1000/window limit.
- Do not use it to access private/protected data unless the user explicitly implements a proper authenticated scope flow.

---

## 23. Verification Checklist

Run when possible:

```bash
npm run db:validate
npm run db:status
npx prisma validate
npx prisma generate
npm run typecheck
npm run build
npm run lint
```

If DB auth is blocked:

- Say so explicitly.
- Do not claim migration applied.
- Do not claim runtime persistence works.
- Still verify schema and build where possible.

Manual test source:

```text
https://www.dailymotion.com/user/Isulli282
```

Manual tests:

- Analyze source
- Refresh metadata
- View reported total if available
- Quick Preview
- Standard Fetch
- Deep Balanced
- Deep Aggressive
- Custom Expert with manual date range
- Stop fetch
- Resume from stopped job if genuinely implemented
- Partial manifest preservation
- Result filters without new API requests
- Capped window warning
- Max items reached warning
- History panel
- Coverage panel
- Dark/light UI readability

---

## 24. Implementation Phases

A single giant change is risky. Prefer phases.

### Phase 1 — Schema and Documentation Foundation

- Update Prisma schema.
- Create migration file.
- Add env docs.
- Update README and ledger.
- Do not apply migration without explicit confirmation.

### Phase 2 — Fetch Settings and UI Separation

- Add Fetch Configuration panel.
- Keep Result Filters separate.
- Add fetch settings validation/clamping.
- Preserve old fetch behavior.

### Phase 3 — Channel Metadata

- Add metadata route/service.
- Fetch `videos_total` if available.
- Add Channel Metadata panel.
- Store snapshots if persistence is ready.

### Phase 4 — Deep Fetch Engine

- Add time-window helpers.
- Add recursive splitting.
- Add dedupe and completeness calculation.
- Preserve partial manifests.

### Phase 5 — Fetch History and Resume

- Persist FetchJob, FetchWindow, FetchPageAttempt.
- Add history panel.
- Add resume algorithm.
- Add coverage snapshot updates.

### Phase 6 — Cleanup and Hardening

- Add TTL cleanup strategy.
- Improve errors and warnings.
- Add tests where possible.
- Final ledger update.

---

## 25. Final Agent Report Template

Every agent must end with:

```text
Summary
Root cause or reason for change
Files changed
What changed
What was preserved
Fetch profiles added
Fetch settings vs result filters separation
Deep fetch strategy
Channel metadata / reported total behavior
Fetch history and resume behavior
Coverage calculation behavior
Database schema changes
Temporary vs permanent data policy
Migration created?
Migration applied?
Environment variables added/changed
Persistence/resume status
Dailymotion API limit handling
Verification results
Blocked tests, if any
Remaining risks/limitations
Ledger update confirmation
Whether secrets were printed
Whether db:apply was run
Whether private/protected data access was added
```

---

## 26. Universal Implementation Prompt

Use this when asking an AI agent to implement the system:

```text
Use the latest available 2026 coding model for this task, preferably Codex GPT-5.5 Pro in Extra High Reasoning Mode. Spawn multiple subagents to explore this repo before implementation.

Project:
AI Public Video Discovery Platform / Dailymotion Discovery.

Task type:
Full-stack / Advanced Channel Explorer Deep Fetch + Fetch History + Resume + Channel Metadata + Coverage + Prisma Persistence Migration.

Main goal:
Implement a professional 2026-grade Channel Explorer system that supports smart fetch profiles, deep time-window fetching, separated Fetch Configuration and Result Filters, Channel Metadata with reported total count, persistent Fetch History, Resume checkpoints, Channel Coverage reporting, and a strong Prisma/PostgreSQL persistence foundation that clearly separates temporary operational data from permanent durable library data.

Must inspect first:
- dailymotion_discovery_ledger.md
- PROJECT_LEDGER.md
- README.md
- .env.example
- package.json
- package-lock.json
- prisma.config.ts
- prisma/schema.prisma
- prisma/migrations/ if it exists
- scripts/db-status.mjs
- scripts/db-validate-env.mjs
- scripts/db-apply.mjs
- src/app/channel-explorer/page.tsx
- src/components/channel-explorer/
- src/components/filters/
- src/app/api/dailymotion/channel/
- src/app/api/dailymotion/search/route.ts
- src/lib/platforms/dailymotion/
- src/lib/manifests/
- src/lib/filters/
- src/lib/config/env.ts
- src/types/
- src/stores/

Check official docs first:
- Dailymotion large catalogs over 1000 videos
- Dailymotion created_after / created_before filters
- Dailymotion pagination limit and page max
- Dailymotion user/profile metadata and videos_total
- Dailymotion public metadata vs protected/private data
- Prisma 7 migrations and prisma.config.ts
- Supabase Prisma/Postgres
- Next.js 16 App Router route handlers
- Vercel timeout/runtime limitations

Core architecture:
Separate:
1. Fetch Configuration — controls API collection.
2. Result Filters — filters already-collected manifest only.
3. Temporary Working Data — fetch jobs, windows, page attempts, partial manifests, resume state.
4. Permanent Durable Data — canonical videos, sources, saved videos, collections, user library data.

Fetch profiles:
- Quick Preview
- Standard Fetch
- Deep Balanced
- Deep Aggressive
- Recent Sync
- Historical Backfill
- Custom Expert Mode

Channel metadata:
Fetch and display reported total from Dailymotion when available, especially videos_total from user/profile metadata. Treat it as reported total, not guaranteed total. Store snapshots over time.

Fetch history/resume:
Track every fetch run, every time window, every API page attempt, every capped/failed/stopped point, and resume cursor. Allow resume from the last safe checkpoint only when persistence is genuinely implemented.

Coverage:
Display reported total, collected unique videos, estimated remaining, coverage percent when valid, capped windows, failed windows, pending windows, and coverage confidence. Never claim full coverage unless every planned window completed without caps, failures, stops, or max-limit interruptions.

Database:
Implement or refine Prisma models for VideoSource, Video, Manifest, ManifestItem, FetchJob, FetchWindow, FetchPageAttempt, SourceCatalogSnapshot, SavedVideo, Collection, and optional FetchJobEvent. Add indexes, unique constraints, JSON fields where useful, and TTL/expiration fields for temporary operational records.

Migration:
Generate a proper Prisma migration file if schema changes are made. Do not run db:apply unless explicitly confirmed. Do not run migrate reset. Do not run db push as production path. If DATABASE_URL auth blocks live verification, still prepare schema/migration safely and report that it was not applied.

Do not:
- rebuild from scratch
- change unrelated areas
- restore DIRECT_URL
- use Supabase direct host
- expose secrets
- require DAILYMOTION_API_KEY for public metadata
- access private data
- download, scrape, or rehost videos
- fabricate channel totals or AI video results
- claim all videos were fetched unless proven
- run destructive DB commands

Verification:
Run when possible:
- npm run db:validate
- npm run db:status
- npx prisma validate
- npx prisma generate
- npm run typecheck
- npm run build
- npm run lint if available

Update:
- dailymotion_discovery_ledger.md
- PROJECT_LEDGER.md if still used
- README.md
- .env.example

Final response must include all required report sections from the guide.
```

---

## 27. Final Rule

When in doubt:

```text
Read the ledger.
Read the code.
Check official docs.
Separate fetch settings from result filters.
Separate temporary operational data from permanent durable data.
Track history and resume checkpoints.
Report coverage honestly.
Do not expose secrets.
Do not run destructive DB commands.
Verify honestly.
Update the ledger.
```

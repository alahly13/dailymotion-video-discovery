# AI Public Video Discovery Platform — 2026 Phase-by-Phase Build Guide

> **Agent startup instruction:** Spawn a subagent to explore this repo before implementation.
>
> This guide is written for any future AI agent, builder, coding assistant, or development team that needs to rebuild the platform from scratch in a clean, professional, 2026-ready way.

---

## 1. Platform Identity

### Platform Name

**AI Public Video Discovery Platform**

### Primary MVP Target

**Dailymotion Public Video Discovery**

### Long-Term Vision

A multi-platform AI-powered public video intelligence system for discovering, filtering, organizing, ranking, and researching public video metadata from multiple public platforms.

Potential future adapters:

- Dailymotion
- YouTube
- VK
- OK.ru
- Reddit video posts
- Public Telegram channels
- Facebook public video pages, if API access allows
- Instagram public media, if API access allows

### Important Product Rule

This platform is **not a video downloader**.

It must never:

- Download videos
- Rehost videos
- Scrape private streams
- Bypass platform restrictions
- Fabricate video results
- Expose server-only API keys to the client

The platform only works with **public video metadata** returned by supported APIs or safe public endpoints.

---

## 2. Core Mission

The platform solves a simple but powerful problem:

> Normal public video search is shallow, keyword-based, and difficult to filter deeply. This platform uses AI and structured manifests to turn public video metadata into a searchable, filterable, explainable video knowledge base.

The platform should allow a user to type natural-language queries such as:

```text
old Arabic documentaries about space from 2018
```

The system should understand the intent and convert it into structured search behavior:

```json
{
  "keywords": "Arabic space documentaries",
  "language": "ar",
  "dateRange": {
    "from": "2018-01-01",
    "to": "2018-12-31"
  },
  "duration": "long",
  "sort": "old"
}
```

Then it should:

1. Fetch real public video metadata.
2. Normalize the metadata.
3. Store results in a temporary manifest.
4. Apply advanced filters.
5. Optionally rerank or summarize results using AI.
6. Allow saving, organizing, and exporting selected videos.

---

## 3. Recommended 2026 Tech Stack

### Frontend and Fullstack

- **Next.js 16 App Router**
- **TypeScript 5 strict mode**
- **Tailwind CSS 4**
- **shadcn/ui**
- **Framer Motion**
- **Zustand** for lightweight state management, if needed
- **React Server Components where appropriate**
- **Client components only where interactivity is required**

### Backend Runtime

- Next.js Route Handlers for MVP
- Server-only API integrations
- Public API adapters per platform
- Zod or safe runtime validation
- AbortController for cancelable long fetch operations

### Database

MVP:

- **Prisma**
- **SQLite**

Future:

- **Supabase PostgreSQL**
- **pgvector** for semantic search
- Optional Redis-like cache for large manifest coordination

### AI

MVP:

- **GLM-5.1**
- Server-only API key
- AI never runs from client-side code

Future:

- Provider adapter pattern:
  - GLM
  - Gemini
  - OpenAI
  - Qwen
  - local models, if appropriate

---

## 4. High-Level Architecture

```text
User Search / Pasted Link / Saved Library Action
        ↓
Input Validation
        ↓
Platform Adapter
        ↓
Public API Fetch
        ↓
Normalize Metadata
        ↓
Manifest Creation
        ↓
Filter Pipeline
        ↓
Sort Pipeline
        ↓
UI Rendering
        ↓
AI Scope-Safe Tools
        ↓
Save / Export / Organize
```

---

## 5. Core Data Principle

Every video result should become a normalized internal object before filters or UI rendering use it.

### Recommended Normalized Video Shape

```ts
export type PlatformId =
  | "dailymotion"
  | "youtube"
  | "vk"
  | "ok"
  | "reddit"
  | "telegram"
  | "unknown";

export interface NormalizedVideoMetadata {
  id: string;
  platform: PlatformId;

  url: string | null;
  embedUrl?: string | null;

  title: string;
  description: string | null;

  thumbnail: string | null;

  duration: number | null;
  views: number | null;
  rating: number | null;

  language: string | null;

  createdAt: string | null;
  year: number | null;

  channelId: string | null;
  channelName: string | null;

  ownerId: string | null;
  ownerName: string | null;

  tags: string[];

  hasThumbnail: boolean;
  hasDescription: boolean;

  raw?: unknown;
}
```

### Zero-Value Rule

This is critical.

Numeric value `0` is valid.

Never treat `0` as missing metadata.

Bad:

```ts
views: raw.views_total || null
```

Good:

```ts
views: raw.views_total ?? null
```

Bad:

```ts
if (!video.views) {
  return "Unknown";
}
```

Good:

```ts
if (video.views === null || video.views === undefined) {
  return "Unknown";
}
```

---

# Build Phases

---

## Phase 0 — Repository and Agent Preparation

### Goal

Prepare a clean, stable, agent-friendly project workspace.

### Tasks

1. Create a new Next.js 16 project.
2. Enable TypeScript strict mode.
3. Install Tailwind CSS 4.
4. Install shadcn/ui.
5. Install Framer Motion.
6. Install Prisma and configure SQLite.
7. Create a project ledger file.

Recommended ledger file:

```text
PROJECT_LEDGER.md
```

### Agent Requirements

Any AI agent must:

- Read the ledger first.
- Explore the repo before editing.
- Make minimal, surgical changes.
- Avoid rebuilding working features unnecessarily.
- Update the ledger after every material change.

### Deliverables

- Clean Next.js app
- Strict TypeScript enabled
- UI base installed
- Ledger created
- Basic folder structure created

### Suggested Folder Structure

```text
src/
  app/
  components/
    layout/
    ui/
    video/
    search/
    link-explorer/
    ai/
    saved-library/
  lib/
    config/
    validation/
    platforms/
      dailymotion/
      youtube/
      shared/
    manifests/
    filters/
    ai/
    database/
  stores/
  types/
prisma/
PROJECT_LEDGER.md
```

---

## Phase 1 — App Shell and UI Foundation

### Goal

Build the visual foundation of the platform.

### Core Views

Create the main navigation structure for:

- Home
- Search
- AI Search
- Link Explorer
- History
- Collections
- Channels
- Saved Library
- Settings, optional

### UI Requirements

- Premium modern design
- Responsive layout
- Dark and light mode support
- Clean card system
- No overlapping elements
- No horizontal mobile overflow
- Consistent spacing
- Accessible buttons and inputs

### Deliverables

- App shell
- Navigation
- Responsive page layout
- Theme system
- Reusable page header
- Reusable empty/loading/error states

---

## Phase 2 — Dailymotion Platform Adapter

### Goal

Create the first public video metadata adapter.

### Important Rule

Do not let UI components depend directly on raw Dailymotion fields.

### Tasks

1. Create a Dailymotion API client.
2. Create safe request helpers.
3. Create URL builders.
4. Create response validation.
5. Create normalization utilities.

### Recommended Files

```text
src/lib/platforms/dailymotion/dailymotion-client.ts
src/lib/platforms/dailymotion/dailymotion-normalize.ts
src/lib/platforms/dailymotion/dailymotion-types.ts
src/lib/platforms/dailymotion/dailymotion-url-analyzer.ts
```

### Normalization Rules

- Convert views into number or null.
- Convert duration into number or null.
- Convert dates into valid strings or null.
- Derive year safely.
- Preserve `0` as valid.
- Normalize channel and owner names.
- Normalize thumbnails.
- Keep raw data only for debug/reference.

### Deliverables

- Search API integration
- Normalized video metadata
- Safe error handling
- No client-side secret exposure

---

## Phase 3 — Basic Search

### Goal

Allow the user to search Dailymotion using keywords and basic API-supported filters.

### API Search Filters

Server-side filters may include:

- Query keyword
- Sort
- Created after
- Created before
- Language
- Duration category

### Tasks

1. Build Search page.
2. Build search form.
3. Create search route handler.
4. Fetch results from Dailymotion.
5. Normalize results.
6. Render results using reusable video cards.

### Deliverables

- Working search page
- Search results grid
- Loading state
- Empty state
- Error state
- Normalized results

---

## Phase 4 — Temporary Search Manifest

### Goal

Store fetched search results into a session-scoped temporary manifest.

### Why This Matters

Advanced filters should apply to already-fetched results, not randomly trigger new searches.

### Recommended Manifest Shape

```ts
export interface TemporarySearchManifest {
  id: string;
  source: "global_search" | "ai_search";
  query: string;
  apiFilters: Record<string, unknown>;
  items: NormalizedVideoMetadata[];
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  isComplete: boolean;
  summary: {
    totalItems: number;
    platform: string;
  };
}
```

### Tasks

1. Create manifest creation utility.
2. Create current manifest store.
3. Add route handlers:
   - Create manifest
   - Get current manifest
   - Clear manifest
   - Filter manifest
4. Add manifest expiration behavior.
5. Prevent stale search results from overriding newer manifests.

### Deliverables

- Temporary Search Manifest system
- Manifest-backed result rendering
- No stale result bugs
- Current manifest state visible to user

---

## Phase 5 — Advanced Manifest Filters

### Goal

Build the crown-jewel filtering system.

### Key Rule

Filters must apply to:

```text
currentTemporarySearchManifest.items
```

Not:

- old API response state
- stale cached arrays
- saved library
- link explorer manifest
- unrelated search results

### Required Filters

```ts
export interface AdvancedManifestFilters {
  keyword?: string;
  category?: string;

  minViews?: number;
  maxViews?: number;
  targetViews?: number;

  minRating?: number;
  maxRating?: number;

  year?: number;
  yearFrom?: number;
  yearTo?: number;

  dateFrom?: string;
  dateTo?: string;

  durationMin?: number;
  durationMax?: number;

  language?: string;
  channel?: string;
  owner?: string;

  sort?:
    | "local_relevance"
    | "newest"
    | "oldest"
    | "highest_views"
    | "least_views"
    | "highest_rating"
    | "lowest_rating"
    | "duration_asc"
    | "duration_desc"
    | "title_asc"
    | "title_desc";

  strictMetadataFiltering?: boolean;
}
```

### Correct Filter Pipeline

```text
manifest.items
  ↓
apply keyword/category/numeric/date/duration/language/channel filters
  ↓
apply strict metadata rules
  ↓
apply sort last
  ↓
render filtered results
```

### Required Utility

```text
src/lib/filters/apply-advanced-manifest-filters.ts
```

### Important Rules

- Use pure functions.
- Never mutate the manifest array.
- Use explicit null/undefined checks.
- Treat `0` as valid metadata.
- Apply sorting after filtering.
- Make filter counts dynamic.
- Show active filter chips.
- Add Reset Filters button.

### Deliverables

- Advanced filter panel
- Shared filter utility
- Correct result counts
- Professional empty state
- Tests or documented verification

---

## Phase 6 — Link Explorer

### Goal

Allow users to paste a supported public Dailymotion URL and fetch related public content.

### Supported Link Types

- Channel URL
- Playlist URL
- User/Profile URL
- Single video URL
- Other list-like Dailymotion URLs if safely supported

### Core Flow

```text
Pasted URL
  ↓
Validate URL
  ↓
Analyze link type
  ↓
Select correct Dailymotion endpoint
  ↓
Fetch first page
  ↓
Create Link Manifest
  ↓
Optional Fetch All pagination
  ↓
Filter and render Link Manifest items
```

### Fetch All Requirements

- Fetch all available public pages where supported.
- Use safe pagination.
- Preserve API rate limits.
- Add delay between requests.
- Add Stop Fetching button.
- Deduplicate by video ID.
- Prevent stale async responses.
- Keep partial results if stopped.

### Recommended Link Manifest Shape

```ts
export interface LinkManifest {
  id: string;
  sourceUrl: string;
  sourceType:
    | "channel"
    | "playlist"
    | "profile"
    | "video"
    | "unknown";

  platform: "dailymotion";
  items: NormalizedVideoMetadata[];

  fetchStatus:
    | "idle"
    | "analyzing"
    | "fetching"
    | "partial"
    | "complete"
    | "error";

  pagesFetched: number;
  totalKnownItems: number | null;

  isComplete: boolean;
  isPartial: boolean;

  createdAt: string;
  updatedAt: string;
}
```

### Link Manifest Filters

- Keyword
- Date range
- Duration range
- Language
- Channel
- Owner
- Has thumbnail
- Has description
- Min views, if available
- Max views, if available
- Sort

### UI Requirements

- URL input
- Analyze button
- Detected link type badge
- Fetch All button
- Stop Fetching button
- Progress card
- Total fetched count
- Filtered count
- Responsive result grid
- No overlapping cards
- No glued-together content

### Deliverables

- Link Explorer page
- Link analyzer
- Link manifest
- Fetch All system
- Link filters
- Responsive UI

---

## Phase 7 — AI Search and AI Query Parsing

### Goal

Use AI to convert natural-language video discovery intent into structured search parameters.

### Core AI Function

Input:

```text
old Arabic space documentaries from 2018
```

Output:

```ts
{
  keywords: string;
  language?: string;
  dateFrom?: string;
  dateTo?: string;
  duration?: "short" | "medium" | "long";
  sort?: string;
}
```

### AI Safety Rules

AI must:

- Parse user intent.
- Suggest filters.
- Explain search strategies.
- Work only with real fetched metadata.
- Never invent video results.
- Never invent video IDs.
- Never claim unavailable videos exist.

### Tasks

1. Create server-only GLM client.
2. Create AI query parser.
3. Validate AI output.
4. Run normal platform search from parsed parameters.
5. Create Temporary Search Manifest from real results.
6. Render results normally.

### Deliverables

- AI Search page
- Natural-language search
- Structured query output
- Manifest-backed AI results
- No hallucinated videos

---

## Phase 8 — AI Scope Separation

### Goal

Prevent AI from mixing contexts.

### Required AI Scopes

```text
1. Global Platform Search
2. Current Temporary Search Manifest
3. Current Link Manifest
4. Saved Library
```

### Scope Rules

#### Global Platform Search

Allowed:

- Parse natural-language search.
- Generate API filters.
- Run public API search.
- Create Temporary Search Manifest.

Not allowed:

- Pretend to work inside a manifest when it is not.

#### Current Temporary Manifest

Allowed:

- Filter current manifest.
- Rank current manifest.
- Summarize current manifest.
- Suggest refinements.

Not allowed:

- Fetch unrelated new results.
- Confuse with Link Manifest.

#### Current Link Manifest

Allowed:

- Filter link items.
- Summarize link content.
- Rank link items.
- Explain matched items.

Not allowed:

- Run global search.
- Invent video IDs.

#### Saved Library

Allowed:

- Filter saved videos.
- Suggest organization.
- Summarize saved collections.

Not allowed:

- Modify saved items without explicit user action.
- Run global search unless user explicitly requests it.

### Deliverables

- AI scope badge
- Scope-specific prompts
- Scope-safe AI route handlers
- Clear user-visible scope indicators

---

## Phase 9 — Saved Library

### Goal

Allow users to save, organize, and export selected video metadata.

### Database Models

Recommended MVP models:

- SavedVideo
- Collection
- CollectionItem
- SearchHistory
- WatchHistory

### Saved Video Fields

- id
- platform
- videoId
- url
- title
- description
- thumbnail
- duration
- views
- language
- channelName
- ownerName
- tags
- favorite
- userNotes
- collectionIds
- createdAt
- updatedAt

### Features

- Save video
- Remove saved video
- Favorite video
- Add notes
- Add tags
- Add to collection
- Search saved library
- Filter saved library
- Export JSON
- Export CSV
- Import JSON with validation
- Backup library

### Deliverables

- Saved Library page
- Prisma schema
- Save/remove/update routes
- Export/import
- Filter system
- Collections support

---

## Phase 10 — Reusable Video Cards and Hover Preview

### Goal

Create one professional video result UI system used across the platform.

### Reusable Card Areas

Use the same card pattern for:

- Search results
- AI Search results
- Temporary Manifest results
- Link Explorer results
- Saved Library
- Collections
- History
- Channel video lists

### Card Requirements

- Thumbnail
- Hover/tap video preview
- Title
- Description snippet
- Channel/owner
- Views
- Duration
- Created date/year
- Language
- Tags
- Save button
- Open video button
- Add to collection
- Favorite
- More menu

### Hover Preview Requirements

- Preview on hover for desktop.
- Tap-to-preview fallback for mobile.
- Muted preview only.
- Only one preview active at a time.
- Do not mount hundreds of iframes at once.
- Mount player only when active.
- Cleanup on mouse leave.
- No raw video streams.
- Use official public embed/player URLs only.

### Deliverables

- Reusable VideoCard
- VideoHoverPreview
- Platform preview adapter
- Responsive layout
- No overlapping UI

---

## Phase 11 — Performance and Large Result Handling

### Goal

Make the platform stable with large manifests.

### Requirements

- Do not render thousands of cards at once if performance drops.
- Add client-side pagination or virtualization.
- Memoize filter results.
- Keep filter functions pure.
- Use abortable fetch for long operations.
- Use request IDs to prevent stale responses.
- Add progress UI for long fetches.
- Keep large manifest state manageable.

### Optional Features

- IndexedDB client-side manifest cache
- Server-side manifest persistence
- Supabase manifest adapter
- Streaming results
- Background indexing

### Deliverables

- Smooth large result rendering
- Stable Fetch All behavior
- No UI freezing
- Clean progressive loading

---

## Phase 12 — Multi-Platform Adapter Architecture

### Goal

Prepare the platform to support more video platforms without rewriting the app.

### Adapter Interface

```ts
export interface VideoPlatformAdapter {
  id: PlatformId;
  displayName: string;

  search(input: PlatformSearchInput): Promise<NormalizedVideoMetadata[]>;

  analyzeUrl?(url: string): Promise<PlatformUrlAnalysis>;

  fetchFromUrl?(
    analysis: PlatformUrlAnalysis,
    options: FetchAllOptions
  ): Promise<PlatformFetchResult>;

  getPreviewConfig?(
    video: NormalizedVideoMetadata
  ): VideoPreviewConfig | null;
}
```

### Important Rule

Each platform should have its own adapter.

Do not mix Dailymotion, YouTube, VK, OK.ru, Reddit, or Telegram logic inside one messy utility.

### Deliverables

- Shared adapter interface
- Dailymotion adapter implemented
- YouTube adapter placeholder
- VK adapter placeholder
- OK.ru adapter placeholder
- Future platform-safe structure

---

## Phase 13 — Semantic Search and AI Indexing

### Goal

Turn saved and manifest data into a semantic video knowledge base.

### Future Features

- AI-generated embeddings
- pgvector
- Semantic query search
- Similar video discovery
- Research clustering
- Auto-generated topic collections
- Manifest summarization
- Markdown research export

### Important Rule

Semantic search must only work on real metadata already fetched or saved.

It must never fabricate unavailable videos.

### Deliverables

- Embedding schema
- AI index status flag
- Vector search adapter
- Semantic result explanation

---

## Phase 14 — Authentication and User Accounts

### Goal

Move from local/personal MVP to multi-user production platform.

### Recommended Stack

- Supabase Auth, or
- Auth.js, or
- Firebase Auth

### User-Scoped Data

Every saved resource must be user-owned:

- Saved videos
- Collections
- Watch history
- Search history
- Saved AI conversations
- Manifest history, if persisted

### Deliverables

- Login
- Logout
- User profile
- Protected saved library
- Owner-scoped database queries
- Secure API routes

---

## Phase 15 — Deployment Paths

This section must be clear for future AI agents.

Do not mix runtime paths.

---

### Local Development Path

Use when developing locally.

Expected behavior:

- Next.js dev server runs locally.
- API routes are same-origin.
- `.env.local` stores local keys.
- Server-only keys must not use `NEXT_PUBLIC_`.

Example:

```env
DAILYMOTION_API_BASE_URL=https://api.dailymotion.com
GLM_API_KEY=server_only_key_here
DATABASE_URL="file:./dev.db"
```

---

### Firebase App Hosting / Unified Next Runtime Path

Use when frontend and backend route handlers are deployed together.

Expected behavior:

- Client calls same-origin route handlers.
- Server-only code stays in server routes/utilities.
- No hardcoded local URLs.
- No client exposure of private keys.

---

### Cloud Run Backend Path

Use when backend is deployed separately.

Expected behavior:

- Frontend uses configured API base URL.
- Backend uses CORS allowlist.
- Secrets stay in Cloud Run environment variables.
- Do not hardcode Cloud Run URLs inside components.

Example:

```env
PUBLIC_APP_URL=https://your-frontend-domain.com
API_BASE_URL=https://your-cloud-run-service-url
CORS_ALLOWED_ORIGINS=https://your-frontend-domain.com
```

---

### Netlify Frontend Path

Use when frontend is deployed separately on Netlify.

Expected behavior:

- Frontend calls external backend API base URL.
- Backend must allow Netlify origin.
- Server-only AI/API keys must never be placed in public frontend env vars.

Example:

```env
NEXT_PUBLIC_APP_URL=https://your-site.netlify.app
NEXT_PUBLIC_API_BASE_URL=https://your-backend.example.com
```

Important:

Only public values should use `NEXT_PUBLIC_`.

---

### Other Runtime Paths

For any other hosting setup:

- Avoid hardcoded URLs.
- Use typed config.
- Separate public client config from server-only secrets.
- Document every required environment variable.
- Test search, Link Explorer, AI Search, and Saved Library after deployment.

---

## Phase 16 — Testing and Verification

### Required Test Areas

#### Search

- Basic keyword search
- Language filter
- Date filter
- Sort
- Empty search result
- API error state

#### Advanced Filters

- minViews
- maxViews
- targetViews
- 0 views
- null views
- duration filters
- date range
- category
- channel
- owner
- sort after filtering
- strict metadata filtering

#### Link Explorer

- Channel URL
- Playlist URL
- Profile URL
- Single video URL
- Invalid URL
- Fetch All
- Stop Fetching
- Partial manifest
- Deduplication
- Link filters
- Link sorting

#### AI

- Query parsing
- AI Search
- Manifest search
- Manifest summary
- AI scope separation
- No hallucinated video results

#### Saved Library

- Save video
- Remove video
- Add note
- Add tags
- Favorite
- Collections
- Export JSON
- Export CSV
- Import with validation

#### UI

- Mobile
- Tablet
- Laptop
- Desktop
- RTL/LTR
- Long titles
- Missing thumbnails
- Hover preview
- Loading states
- Empty states

---

## 17. Common Bugs to Prevent

### 0 Treated as Missing

Never use truthiness checks for numeric metadata.

Bad:

```ts
if (!views) {}
```

Good:

```ts
if (views === null || views === undefined) {}
```

### Stale Manifest

Prevent old search responses from replacing newer state.

Use:

- Request IDs
- Timestamps
- AbortController
- Current query/filter matching

### Filters Applied to Wrong Source

Make sure:

- Advanced Search filters use Temporary Search Manifest.
- Link Explorer filters use Link Manifest.
- Saved Library filters use saved videos.
- AI scope stays isolated.

### Sort Before Filter

Correct order:

```text
filter first
sort second
render third
```

### Rendering Too Many Players

Do not render iframe previews for all cards.

Mount preview only on hover/tap.

### Duplicated Filter Logic

Keep filtering in shared pure utilities.

---

## 18. AI Agent Implementation Rules

Any future AI agent must follow these rules:

1. Spawn a subagent to explore this repo.
2. Read the project ledger first.
3. Inspect real files before coding.
4. Do not guess field names.
5. Do not rebuild from scratch unless explicitly requested.
6. Make minimal, surgical, backward-compatible changes.
7. Keep AI API keys server-only.
8. Keep public API adapters separated.
9. Do not add video downloading.
10. Do not scrape private content.
11. Do not fabricate video results.
12. Use strict TypeScript.
13. Use validation for API inputs.
14. Use pure filter utilities.
15. Treat `0` as valid metadata.
16. Update the ledger after every material change.
17. Provide files changed, root cause, verification, and limitations in the final response.

---

## 19. Suggested Final MVP Checklist

The MVP is ready when the platform has:

- Home page
- Search page
- Dailymotion API search
- Temporary Search Manifest
- Advanced filters
- Correct zero-value handling
- Link Explorer
- Fetch All
- Link Manifest filters
- AI Search
- AI scope separation
- Saved Library
- Collections
- Export/import
- Reusable video cards
- Hover preview
- Responsive UI
- Server-only AI key
- Validation
- Error states
- Loading states
- Empty states
- Project ledger

---

## 20. Final Product Summary

The final platform should feel like this:

> A professional AI-first public video discovery and research platform that fetches real public video metadata, organizes it into manifests, applies deep filters, uses AI safely inside strict scopes, and allows users to save, organize, preview, and export video knowledge without downloading or rehosting videos.

The most important architecture idea is:

```text
Public API metadata
  → normalized video objects
  → manifests
  → filters
  → AI scoped tools
  → saved knowledge base
```

Build every feature around this idea.

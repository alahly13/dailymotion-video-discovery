# Dailymotion Discovery — AI Agent Prompt Rules & Master Template 2026

> Use this file before asking any AI agent to modify, debug, design, migrate, or document the `dailymotion-video-discovery` project.
>
> Default requested model: **Codex GPT-5.5 Pro — Extra High Reasoning Mode** or the latest available 2026 coding model.

---

## 0. Required Opening Line

Every serious prompt should start with:

```text
Use the latest available 2026 coding model for this task, preferably Codex GPT-5.5 Pro in Extra High Reasoning Mode. Spawn multiple subagents to explore this repo before implementation.
```

For a smaller task:

```text
Use the latest available 2026 coding model for this task. Analyze the current codebase first before making any changes.
```

---

## 1. Project Identity

**Project:** AI Public Video Discovery Platform / Dailymotion Discovery

**Mission:** Build a professional AI-powered public video metadata discovery platform focused on Dailymotion first, with future multi-platform support.

**Core capabilities:**

- Public Dailymotion search
- Dailymotion Channel Explorer
- Fetch All with safe pagination
- Channel/Search manifests
- Advanced filtering and sorting
- Gemini AI search/helper/summarization
- Saved Library / favorites / collections foundation
- Supabase PostgreSQL + Prisma
- Vercel deployment
- Light/Dark mode UI

**Not allowed:**

- No video downloading
- No rehosting
- No private stream scraping
- No platform bypassing
- No fabricated AI video results
- No browser exposure of secrets

---

## 2. Repo-First and Ledger-First Discipline

Before editing anything, the agent must inspect the current repo. The real code is the source of truth.

Read first:

```text
dailymotion_discovery_ledger.md
PROJECT_LEDGER.md
README.md
package.json
package-lock.json
.env.example
prisma.config.ts
prisma/schema.prisma
scripts/
src/app/
src/components/
src/lib/
src/types/
src/stores/
.github/workflows/
```

If the ledger disagrees with the current code, trust the current code and document the mismatch.

After meaningful changes, update:

```text
dailymotion_discovery_ledger.md
```

or, if still used:

```text
PROJECT_LEDGER.md
```

Ledger entries should include date, files changed, summary, reason, technical details, risks, verification, and remaining limitations.

---

## 3. Core Non-Negotiable Rules

```text
Do not rebuild from scratch.
Do not redesign architecture unless explicitly requested.
Do not change unrelated areas.
Do not remove working features.
Do not remove fallbacks, guards, normalization helpers, or defensive code without proof.
Do not expose secrets.
Do not move backend authority into frontend.
Do not create duplicate systems.
Do not introduce random UI colors or disconnected design systems.
Do not run destructive database commands.
```

Prefer:

```text
repair → reconnect → harden → extend → refine
```

not:

```text
delete → replace → rebuild
```

---

## 4. Official Documentation Rule 2026

Whenever the task touches version-sensitive tooling, the agent must verify current official docs first.

Check official docs for:

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase
- Prisma 7 / `prisma.config.ts`
- dotenv
- Vercel
- GitHub Actions
- Dailymotion API
- Gemini SDK
- Zustand / TanStack tools if used

Do not rely only on memory.

---

## 5. Task-Type Classification

Every implementation prompt must declare one type.

### Type A — UI-Only

Use for pages, layout, colors, cards, responsiveness, theme, buttons, filters UI, loading/empty/error states.

Rules:

```text
Do not alter backend behavior.
Do not change API contracts.
Do not redesign unrelated pages.
Preserve responsiveness.
Preserve current interactions unless requested.
Verify mobile/tablet/laptop/desktop layouts.
```

### Type B — Backend-Only

Use for API routes, Prisma, Supabase, migrations, env validation, Dailymotion services, Gemini routes, fetch jobs, manifest persistence, security.

Rules:

```text
Keep backend authority on the backend.
Preserve route contracts where possible.
Add validation and structured errors.
Do not move secrets to client.
Do not redesign UI.
```

### Type C — Full-Stack

Use when both UI and backend/API contracts must change.

Rules:

```text
Trace browser action → API route → service → database/external API → response → UI rendering.
Do not fix frontend symptom while leaving backend root cause.
Do not change payload shape without updating all dependent layers.
```

### Type D — New Feature / New Tool

Use for a new page, new route, new platform adapter, new AI tool, new export, new saved-library feature.

Rules:

```text
Attach the feature to the existing architecture.
Do not create a disconnected second system.
Reuse existing manifest/filter/video-card/AI patterns where appropriate.
Document the feature in the ledger.
```

### Type E — Hybrid / Architecture-Sensitive

Use for middleware, deployment behavior, auth/session, Prisma/Supabase architecture, large manifest persistence, AI scope boundaries, multi-platform architecture.

Rules:

```text
Do not broad-refactor.
Preserve compatibility layers.
Clearly state authority boundaries.
Prefer incremental migration over clean-slate replacement.
```

---

## 6. Environment-Specific Requirement

For runtime-sensitive tasks, separate analysis by:

### 1. Local / Windows / PowerShell

Consider `.env.local`, dotenv, PowerShell syntax, URL-encoded database passwords, the `DATABASE_URL`-only policy, and `npm` scripts.

### 2. Vercel Production / Preview

Consider Vercel env vars, build-time vs runtime env, middleware edge-safety, same-origin APIs, server-only Gemini/Prisma behavior, and no migrations during normal Vercel build.

### 3. Supabase PostgreSQL

Consider free-plan IPv4 limitation, Session Pooler, canonical schema, migrations, RLS if auth/user data exists, and Postgres indexes.

### 4. GitHub Actions

Consider manual `workflow_dispatch`, secrets, `db:validate`, pre-status, guarded `db:apply`, post-status, and no secret logging.

### 5. Codex / Online Agent Environment

Consider missing dependencies, missing real DB secrets, blocked live verification, and honest reporting.

---

## 7. Database and Migration Rules

Before DB/backend work, inspect:

```text
prisma.config.ts
prisma/schema.prisma
prisma/migrations/
scripts/db-validate-env.mjs
scripts/db-apply.mjs
.env.example
README.md
```

Rules:

```text
Use latest canonical schema.
Do not write new backend logic against stale tables.
Create migrations for schema changes.
Never run prisma migrate reset.
Never drop tables unless explicitly requested and proven safe.
Do not use prisma db push as production apply path.
Use prisma migrate deploy for committed production/staging migrations.
```

Dailymotion Discovery canonical concepts:

- `VideoSource` — public channel/profile/playlist/source identity
- `Video` — canonical normalized public video metadata
- `Manifest` — fetched result set
- `ManifestItem` — video inside manifest with ordering/context
- `FetchJob` — long-running or resumable fetch process
- `SavedVideo` — user saved/favorite video reference
- Future: collections, tags, AI conversations, embeddings

DATABASE policy:

```text
DATABASE_URL is the single required database URL.
Prisma CLI, db:status, db:apply, migrations, and runtime DB access use DATABASE_URL only.
For Supabase Free / IPv4-limited workflows, DATABASE_URL must use Session Pooler.
Do not add direct Supabase host URLs as active migration overrides.
```

---

## 8. Env and Secrets Rules

### Public / Browser-Safe

```env
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

### Server-Only Secrets

```env
DATABASE_URL=
GEMINI_API_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DAILYMOTION_API_KEY=
CRON_SECRET=
WEBHOOK_SECRET=
```

### Server-Only Config / Feature Flags

```env
DAILYMOTION_API_BASE_URL=https://api.dailymotion.com
ENABLE_MANIFEST_PERSISTENCE=true
ENABLE_PGVECTOR=false
MAX_CHANNEL_FETCH_PAGES=200
MAX_CHANNEL_FETCH_ITEMS=10000
CHANNEL_FETCH_DELAY_MS=250
AI_EMBEDDING_MODEL=
```

Rules:

```text
Do not print secrets.
Do not commit .env or .env.local.
.env.example must explain purpose, required level, accepted values, source, and missing behavior.
dotenv should load env files for standalone scripts.
Runtime env must still be validated safely.
Build stubs must not become runtime truth.
```

---

## 9. Dailymotion API Rules

```text
Use public metadata endpoints where possible.
DAILYMOTION_API_KEY is optional.
Do not make DAILYMOTION_API_KEY block startup.
Do not download videos.
Do not scrape streams.
Do not rehost content.
Do not fabricate results.
Use typed safe results for external API calls.
Preserve partial manifests when fetch fails mid-way.
```

Channel Explorer must preserve:

- Analyze source input
- Fetch first page
- Fetch all public results with safety limits
- Stop fetching
- Partial manifest preservation
- Video-ID deduplication
- Current-manifest-only filters
- Stale response prevention

---

## 10. Gemini AI Rules

```text
Gemini API key is server-only.
Gemini must not run from client components.
AI must never invent videos.
AI must only reason over real fetched metadata.
AI output must be validated before applying filters/search params.
If Gemini fails, normal search/filter UI must keep working.
```

Keep AI scopes separate:

- Global Search
- Current Search Manifest
- Current Channel Manifest
- Saved Library
- Future Collections / Multi-platform scopes

---

## 11. Advanced Filter Rules

Filters must apply to the correct source only:

```text
Search filters → current Search Manifest
Channel filters → current Channel Manifest
Saved filters → Saved Library
AI filters → current allowed AI scope only
```

Rules:

```text
Filter first, sort second, render third.
Do not mutate original manifest items.
Do not use stale arrays.
Do not trigger new searches just because filters changed.
Treat 0 as valid metadata.
Do not use truthiness checks for numeric metadata.
```

Good:

```ts
views === null || views === undefined
raw.views_total ?? null
```

Bad:

```ts
!views
raw.views_total || null
```

---

## 12. UI and Design Rules

For UI tasks:

```text
Preserve functionality.
Improve visual hierarchy.
Use warm, calm, premium 2026 design.
Support dark and light mode.
Avoid random colors.
Avoid harsh pure black or blinding pure white.
Ensure all pages are responsive.
Keep cards spacious and readable.
Do not sacrifice usability for decoration.
```

Important UI areas:

- App shell
- Dashboard/home
- Search page
- AI Search page
- Channel Explorer
- Saved Library
- Video cards
- Filters
- Active filter chips
- Fetch progress
- Manifest summary
- Empty/loading/error states
- Theme toggle
- Favicon/browser icon

Video cards must show:

- Thumbnail with stable aspect ratio
- Title with line clamp
- Channel/owner
- Views
- Duration
- Date/year
- Language if available
- Actions
- Hover preview if supported
- Zero values correctly, e.g. `0 views`

---

## 13. Middleware Safety Rules

Middleware must be Edge-safe.

```text
Do not import Prisma in middleware.
Do not import Gemini in middleware.
Do not import server-only env validation in middleware.
Do not require DATABASE_URL in middleware.
Do not use Node-only modules in middleware.
Use public Supabase env only if needed.
Matcher should exclude static assets, images, favicon, and Next internals.
```

If Vercel shows `MIDDLEWARE_INVOCATION_FAILED`, inspect runtime logs and middleware imports first.

---

## 14. Dependency Discipline

Before adding packages:

```text
Inspect package.json.
Inspect package-lock.json.
Verify current versions.
Prefer existing dependencies.
Add packages only when truly needed.
Justify new dependencies.
Keep lockfile aligned.
```

Do not import undeclared packages.

---

## 15. Verification Rules

After meaningful changes, run when possible:

```bash
npm run db:validate
npm run env:validate
npm run typecheck
npm run build
npm run lint
```

For UI changes, verify:

```text
/
/channel-explorer
/search
/ai-search
/saved
```

For DB changes, verify:

```bash
npm run db:status
```

Only apply migrations with explicit confirmation:

```powershell
$env:CONFIRM_DB_APPLY="true"; npm run db:apply
```

or:

```bash
CONFIRM_DB_APPLY=true npm run db:apply
```

Do not claim a migration was applied unless it truly ran against the real database.

---

## 16. Required Final Agent Report

Every agent must end with:

```text
Summary
Root cause or reason for change
Files changed
What changed
What was preserved
Environment-specific impact
Verification results
Blocked tests, if any
Remaining risks/limitations
Ledger update confirmation
```

For UI tasks:

```text
Light/dark mode checked?
Responsive behavior checked?
Pages reviewed?
Cards/forms/filters checked?
```

For DB tasks:

```text
Canonical schema impact
Migration impact
Read/write path impact
Whether db:apply was run
Whether secrets were printed
```

---

## 17. Short Universal Prompt Template

```text
Use the latest available 2026 coding model for this task, preferably Codex GPT-5.5 Pro in Extra High Reasoning Mode.

Spawn multiple subagents to explore this repo in parallel:
1. architecture and dependency tracing
2. frontend/UI flow tracing
3. backend/API/runtime tracing
4. environment/Supabase/Prisma/Gemini tracing
5. build/test/deployment verification

Analyze the current codebase first before making any changes.

Project:
AI Public Video Discovery Platform / Dailymotion Discovery.

Important:
This is an existing production-style project. Do not rebuild from scratch. Do not redesign the architecture unless explicitly requested. Do not remove working features. Do not change unrelated areas. Make only the minimal, surgical, backward-compatible changes required for this task.

Read first:
- dailymotion_discovery_ledger.md
- PROJECT_LEDGER.md
- README.md
- package.json
- package-lock.json
- relevant source files

Task type:
[UI-only / Backend-only / Full-stack / New feature / Hybrid]

Task:
[write the exact task]

Expected result:
[write the desired end state]

Environment paths to consider:
1. Local/Windows/PowerShell
2. Vercel production/preview
3. Supabase Postgres Session Pooler
4. GitHub Actions migration workflow
5. Codex/online agent environment

Do not:
- rebuild the app
- change unrelated files
- expose secrets
- run destructive DB commands
- remove fallbacks or guards without proof
- let AI fabricate videos
- add downloading/scraping/rehosting

Verification:
Run relevant checks:
- npm run typecheck
- npm run build
- npm run db:validate if DB/env touched
- npm run db:status if DB connection can be tested
- npm run lint if available

Update:
- dailymotion_discovery_ledger.md or PROJECT_LEDGER.md

Final response must include:
- files changed
- what changed
- what was preserved
- verification
- limitations
```

---

## 18. JSON Prompt Template

```json
{
  "prompt_for": "Codex GPT-5.5 Pro Extra High Mode",
  "project": "AI Public Video Discovery Platform / Dailymotion Discovery",
  "year": 2026,
  "mode": "Update existing project, do not rebuild from scratch",
  "startup_instruction": "Spawn multiple subagents to explore this repo before implementation.",
  "task_type": "UI-only | Backend-only | Full-stack | New feature | Hybrid",
  "main_goal": "WRITE_THE_EXACT_GOAL_HERE",
  "must_do_first": [
    "Read dailymotion_discovery_ledger.md if present.",
    "Read PROJECT_LEDGER.md and README.md.",
    "Inspect package.json and package-lock.json.",
    "Analyze the current codebase before changing anything.",
    "Trace relevant imports, routes, services, state, and runtime boundaries.",
    "Check official docs for any version-sensitive framework/library/API behavior.",
    "Identify the smallest safe edit surface."
  ],
  "project_rules": [
    "Do not rebuild from scratch.",
    "Do not change unrelated areas.",
    "Do not remove working features.",
    "Do not expose secrets.",
    "Do not add downloading, scraping, rehosting, or stream bypassing.",
    "Do not let AI fabricate video results.",
    "Preserve Channel Manifest, Search Manifest, Saved Library, and AI scope separation.",
    "Treat 0 numeric metadata as valid."
  ],
  "environment_paths": [
    "Local / Windows / PowerShell",
    "Vercel Production / Preview",
    "Supabase Postgres Session Pooler",
    "GitHub Actions migrations",
    "Codex / online agent environment"
  ],
  "files_to_inspect_first": [
    "README.md",
    "PROJECT_LEDGER.md",
    "dailymotion_discovery_ledger.md",
    "package.json",
    "package-lock.json",
    "prisma.config.ts",
    "prisma/schema.prisma",
    "scripts/",
    "src/app/",
    "src/components/",
    "src/lib/",
    ".github/workflows/"
  ],
  "task_requirements": [
    "ADD_TASK_SPECIFIC_REQUIREMENTS_HERE"
  ],
  "do_not": [
    "Do not run prisma migrate reset.",
    "Do not drop tables.",
    "Do not print DATABASE_URL, GEMINI_API_KEY, or any secrets.",
    "Do not import server-only code into client components.",
    "Do not import Prisma/Gemini/server env into middleware.",
    "Do not claim live verification if it was not performed."
  ],
  "verification_requirements": [
    "Run npm run typecheck when possible.",
    "Run npm run build when possible.",
    "Run npm run db:validate if env/database code was touched.",
    "Run npm run lint if available.",
    "Explain blocked tests clearly."
  ],
  "ledger_update_required": true,
  "final_response_required": [
    "Summary",
    "Files changed",
    "What changed",
    "What was preserved",
    "Environment impact",
    "Verification results",
    "Remaining limitations",
    "Ledger update confirmation"
  ]
}
```

---

## 19. Example UI Prompt

```text
Use the latest available 2026 coding model for this task, preferably Codex GPT-5.5 Pro in Extra High Reasoning Mode.

Spawn multiple subagents to explore this repo before implementation.

Task type: UI-only.

Task:
Improve the Channel Explorer page layout and video result cards so the page feels more premium, calm, responsive, and easier to scan in both dark and light mode.

Rules:
- Do not change Dailymotion fetching logic.
- Do not change manifest/filter logic.
- Do not touch Prisma/Supabase/Gemini routes.
- Preserve all existing actions and data.
- Only improve UI, spacing, hierarchy, responsiveness, cards, and theme consistency.

Inspect first:
- src/app/channel-explorer/page.tsx
- src/components/video/
- src/components/filters/
- src/components/channel-explorer/
- src/app/globals.css
- theme/layout files

Verify:
- npm run typecheck
- npm run build
- Review /channel-explorer, /search, /saved where shared cards are used.

Update dailymotion_discovery_ledger.md.
```

---

## 20. Example Backend Prompt

```text
Use the latest available 2026 coding model for this task, preferably Codex GPT-5.5 Pro in Extra High Reasoning Mode.

Task type: Backend-only.

Task:
Fix database migration/env behavior so DATABASE_URL is the only active database variable and Prisma CLI always uses the Supabase Session Pooler DATABASE_URL.

Rules:
- Use dotenv for standalone scripts.
- Support Supabase Session Pooler on the free plan.
- Do not print secrets.
- Do not run db:apply unless explicitly confirmed.
- Do not run migrate reset or drop tables.
- Preserve existing app features.

Inspect:
- prisma.config.ts
- scripts/db-validate-env.mjs
- scripts/db-apply.mjs
- .env.example
- README.md
- package.json

Verify:
- npm run db:validate
- npm run typecheck
- npm run build

Update dailymotion_discovery_ledger.md.
```

---

## 21. Final Rule

When in doubt:

```text
Read the ledger.
Read the code.
Check official docs.
Change only the necessary files.
Preserve architecture.
Do not expose secrets.
Verify honestly.
Update the ledger.
```

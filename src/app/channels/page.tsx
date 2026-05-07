import Link from "next/link";
import { ArrowRight, History, Play, RefreshCcw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { channelDatabasePersistenceMode, listPersistedChannelSources } from "@/lib/repositories/channel-fetch-persistence";
import type { ChannelSourceSummary } from "@/types/channel-fetch";

export const dynamic = "force-dynamic";

const numberFormatter = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined) return "Unknown";
  return numberFormatter.format(value);
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Never";
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? "Unknown" : date.toLocaleString("en", { dateStyle: "medium", timeStyle: "short" });
}

function sourceName(source: ChannelSourceSummary) {
  return source.displayName ?? source.username ?? source.handle ?? source.externalSourceId;
}

function fetchLabel(source: ChannelSourceSummary) {
  if (source.latestAttemptStatus === "running" || source.latestAttemptStatus === "pending") return "Fetching...";
  if (source.latestResumableAttemptId) return "Resume Fetch";
  if (source.coverageStatus === "complete") return "Refresh / Re-check Channel";
  return source.totalAttempts > 0 ? "Continue Fetch" : "Start Fetch";
}

function explorerHref(source: ChannelSourceSummary) {
  const params = new URLSearchParams({ source: source.sourceInput });
  if (source.latestResumableAttemptId) params.set("resumeJobId", source.latestResumableAttemptId);
  return `/channel-explorer?${params.toString()}`;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[var(--border)] bg-[var(--surface-muted)] p-3">
      <p className="text-[11px] font-black uppercase text-[var(--muted-foreground)]">{label}</p>
      <p className="mt-1 text-sm font-bold">{value}</p>
    </div>
  );
}

export default async function ChannelsPage() {
  // This page is intentionally dynamic because it reads the persisted channel
  // catalog through Prisma. Future agents should not make this static; that
  // would move DB access into the Next build and break Vercel-safe deployments.
  const [sources, persistence] = await Promise.all([
    listPersistedChannelSources(100),
    Promise.resolve(channelDatabasePersistenceMode()),
  ]);

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase text-[var(--accent)]">Saved Channel History</p>
          <h1 className="mt-2 max-w-4xl text-4xl font-black leading-tight sm:text-5xl">Browse persisted fetch attempts and combined manifests.</h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--muted-foreground)]">
            These channels come from DB-backed Channel Explorer history. Searching and filtering these pages only uses saved public metadata.
          </p>
        </div>
        <Link href="/channel-explorer" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold transition hover:bg-[var(--surface-muted)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring)]">
          <Play className="h-4 w-4" aria-hidden="true" />
          Channel Explorer
        </Link>
      </section>

      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 text-sm leading-6 text-[var(--muted-foreground)]">
        Persistence mode: <span className="font-bold text-[var(--foreground)]">{persistence}</span>. Combined manifests are source-level catalogs; attempts remain visible separately for audit and resume decisions.
      </div>

      {sources.length === 0 ? (
        <Card className="space-y-3">
          <h2 className="text-xl font-black">No saved channel attempts yet</h2>
          <p className="text-sm leading-6 text-[var(--muted-foreground)]">Analyze a public Dailymotion source, start a fetch, and stop or complete at least one chunk to populate persisted history here.</p>
          <Link href="/channel-explorer" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-foreground)] transition hover:bg-[var(--accent-strong)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring)]">
            Start Fetch
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Card>
      ) : (
        <div className="grid gap-5">
          {sources.map((source) => (
            <Card key={source.id} className="space-y-5">
              <div className="grid gap-4 lg:grid-cols-[auto_1fr_auto] lg:items-start">
                <div className="h-16 w-16 overflow-hidden rounded-md border border-[var(--border)] bg-[var(--surface-muted)]">
                  {source.avatarUrl || source.thumbnailUrl ? (
                    <img src={source.avatarUrl ?? source.thumbnailUrl ?? ""} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xl font-black text-[var(--muted-foreground)]">{sourceName(source).slice(0, 1).toUpperCase()}</div>
                  )}
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-2xl font-black">{sourceName(source)}</h2>
                  <p className="mt-1 break-all text-sm text-[var(--muted-foreground)]">{source.handle ?? source.username ?? source.canonicalUrl ?? source.sourceInput}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-black uppercase text-[var(--muted-foreground)]">
                    <span className="rounded-md border border-[var(--border)] bg-[var(--surface-muted)] px-2 py-1">{source.sourceType}</span>
                    <span className="rounded-md border border-[var(--border)] bg-[var(--surface-muted)] px-2 py-1">Source ID: {source.externalSourceId}</span>
                    <span className="rounded-md border border-[var(--border)] bg-[var(--surface-muted)] px-2 py-1">{source.coverageStatus} / {source.coverageConfidence}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 lg:justify-end">
                  <Link href={`/channels/${source.id}`} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-foreground)] transition hover:bg-[var(--accent-strong)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring)]">
                    Open Combined Manifest
                  </Link>
                  <Link href={`/channels/${source.id}#attempts`} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold transition hover:bg-[var(--surface-muted)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring)]">
                    <History className="h-4 w-4" aria-hidden="true" />
                    View Attempts
                  </Link>
                  <Link href={explorerHref(source)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold transition hover:bg-[var(--surface-muted)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring)]">
                    <RefreshCcw className="h-4 w-4" aria-hidden="true" />
                    {fetchLabel(source)}
                  </Link>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
                <Stat label="Reported total" value={formatNumber(source.reportedTotalFromApi)} />
                <Stat label="Unique collected" value={formatNumber(source.collectedUniqueVideos)} />
                <Stat label="Estimated remaining" value={formatNumber(source.estimatedRemainingVideos)} />
                <Stat label="Coverage" value={source.coveragePercent === null ? "Unknown" : `${source.coveragePercent}%`} />
                <Stat label="Attempts" value={String(source.totalAttempts)} />
                <Stat label="Latest attempt" value={source.latestAttemptNumber ? `#${source.latestAttemptNumber} ${source.latestAttemptStatus ?? ""}` : "None"} />
                <Stat label="Last fetch" value={formatDate(source.lastFetchTime)} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

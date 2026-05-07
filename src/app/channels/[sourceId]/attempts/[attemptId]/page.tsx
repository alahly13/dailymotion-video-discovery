import Link from "next/link";
import { ArrowLeft, Play, RotateCcw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { VideoResultsGrid } from "@/components/video/video-results-grid";
import { getPersistedChannelAttemptDetail } from "@/lib/repositories/channel-fetch-persistence";

export const dynamic = "force-dynamic";

function formatDate(value: string | null | undefined) {
  if (!value) return "Unavailable";
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? "Unavailable" : date.toLocaleString("en", { dateStyle: "medium", timeStyle: "short" });
}

function formatWindow(start: string | null, end: string | null) {
  if (!start && !end) return "Open range";
  return `${start?.slice(0, 10) ?? "open"} -> ${end?.slice(0, 10) ?? "open"}`;
}

function explorerHref(sourceInput: string, resumeJobId?: string | null) {
  const params = new URLSearchParams({ source: sourceInput });
  if (resumeJobId) params.set("resumeJobId", resumeJobId);
  return `/channel-explorer?${params.toString()}`;
}

function Stat({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="rounded-md border border-[var(--border)] bg-[var(--surface-muted)] p-3">
      <p className="text-[11px] font-black uppercase text-[var(--muted-foreground)]">{label}</p>
      <p className="mt-1 break-words text-sm font-bold">{value ?? "Unavailable"}</p>
    </div>
  );
}

export default async function AttemptDetailPage({
  params,
}: {
  params: Promise<{ sourceId: string; attemptId: string }>;
}) {
  const { sourceId, attemptId } = await params;
  const attempt = await getPersistedChannelAttemptDetail(attemptId, sourceId);

  if (!attempt) {
    return (
      <div className="space-y-5">
        <Link href={`/channels/${sourceId}`} className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent-strong)]">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to channel
        </Link>
        <Card>
          <h1 className="text-2xl font-black">Attempt not found</h1>
          <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">No persisted attempt detail exists for this channel and attempt ID.</p>
        </Card>
      </div>
    );
  }

  const job = attempt.job;
  const source = attempt.source;
  const progress = job.progress;
  const settings = job.settings;
  const resumable = job.historyEntry.resumable;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href={`/channels/${source.id}`} className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent-strong)]">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to combined manifest
        </Link>
        <div className="flex flex-wrap gap-2">
          {resumable ? (
            <Link href={explorerHref(source.sourceInput, job.id)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-foreground)] transition hover:bg-[var(--accent-strong)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring)]">
              <Play className="h-4 w-4" aria-hidden="true" />
              Resume Fetch
            </Link>
          ) : null}
          <Link href={explorerHref(source.sourceInput)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold transition hover:bg-[var(--surface-muted)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring)]">
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Continue Channel Fetch
          </Link>
        </div>
      </div>

      <section className="space-y-4">
        <div>
          <p className="text-sm font-bold uppercase text-[var(--accent)]">Attempt Detail</p>
          <h1 className="mt-2 text-4xl font-black leading-tight sm:text-5xl">Attempt #{job.attemptNumber}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted-foreground)]">
            {source.displayName ?? source.username ?? source.handle ?? source.externalSourceId} / {job.sourceKey}
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          <Stat label="Status" value={`${job.status} / ${job.completenessStatus}`} />
          <Stat label="Fetch profile" value={settings.fetchProfile} />
          <Stat label="Started" value={formatDate(job.historyEntry.startedAt)} />
          <Stat label="Completed" value={formatDate(job.historyEntry.completedAt)} />
          <Stat label="Resumable" value={resumable ? "Yes" : "No"} />
          <Stat label="Checkpoint" value={progress.lastCheckpoint ?? progress.currentWindow?.id ?? "Unavailable"} />
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <Card className="space-y-4">
          <h2 className="text-xl font-black">Progress</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Stat label="Videos in attempt" value={attempt.items.length} />
            <Stat label="Unique added" value={progress.uniqueItemsCollected} />
            <Stat label="Duplicates skipped" value={progress.duplicateCount} />
            <Stat label="Pages fetched" value={progress.pagesFetched} />
            <Stat label="Windows processed" value={progress.windowsProcessed} />
            <Stat label="Capped / failed windows" value={`${progress.cappedWindowCount} / ${progress.failedWindowCount}`} />
          </div>
        </Card>
        <Card className="space-y-4">
          <h2 className="text-xl font-black">Settings Used</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Stat label="Page size" value={settings.pageSize} />
            <Stat label="Max items" value={settings.maxItems} />
            <Stat label="Max pages" value={settings.maxTotalPages} />
            <Stat label="Max windows" value={settings.maxWindows} />
            <Stat label="Window unit" value={`${settings.initialWindowUnit} -> ${settings.minimumSplitUnit}`} />
            <Stat label="Auto split capped" value={settings.autoSplitCappedWindows ? "Yes" : "No"} />
          </div>
        </Card>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <Card className="space-y-4">
          <h2 className="text-xl font-black">Window Timeline</h2>
          <div className="max-h-[34rem] space-y-3 overflow-auto pr-1">
            {attempt.windows.map((window) => (
              <div key={window.id} className="rounded-md border border-[var(--border)] bg-[var(--background-elevated)] p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-black">{formatWindow(window.windowStart, window.windowEnd)}</p>
                  <span className="rounded-md border border-[var(--border)] bg-[var(--surface-muted)] px-2 py-1 text-[11px] font-black uppercase text-[var(--muted-foreground)]">{window.status}</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                  {window.pagesFetched} pages, {window.uniqueItemsAdded} unique, {window.duplicateItemsFound} duplicates, next page {window.nextPageToFetch}.
                </p>
                {window.errorMessage ? <p className="mt-2 text-sm font-semibold text-[var(--danger)]">{window.errorMessage}</p> : null}
              </div>
            ))}
          </div>
        </Card>

        <Card className="space-y-4">
          <h2 className="text-xl font-black">Page Timeline</h2>
          <div className="max-h-[34rem] space-y-3 overflow-auto pr-1">
            {attempt.pageAttempts.map((page) => (
              <div key={page.id} className="rounded-md border border-[var(--border)] bg-[var(--background-elevated)] p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-black">Page {page.pageNumber}</p>
                  <span className="rounded-md border border-[var(--border)] bg-[var(--surface-muted)] px-2 py-1 text-[11px] font-black uppercase text-[var(--muted-foreground)]">{page.status}</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                  {page.itemsReturned} returned, {page.uniqueItemsAdded} unique, {page.duplicateItemsFound} duplicates, has more: {page.hasMore ? "yes" : "no"}.
                </p>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">Requested {formatDate(page.requestedAt)}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-black">Attempt Videos</h2>
          <p className="mt-1 text-sm leading-6 text-[var(--muted-foreground)]">This grid is attempt-scoped. Use the combined manifest page to search across all unique saved videos for the channel.</p>
        </div>
        <VideoResultsGrid items={attempt.items} resultViewMode="current-attempt" />
      </section>
    </div>
  );
}

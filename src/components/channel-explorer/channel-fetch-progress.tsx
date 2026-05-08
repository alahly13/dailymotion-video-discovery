import { Activity, Database, Gauge, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { ChannelCoverage, ChannelPersistenceMode, FetchProgressSummary } from "@/types/channel-fetch";

function formatValue(value: string | number | null | undefined) {
  return value === null || value === undefined || value === "" ? "Unknown" : value;
}

function Metric({ label, value, tone }: { label: string; value: string | number | null | undefined; tone?: "success" | "warning" | "error" | "info" }) {
  const toneClass = {
    success: "text-[var(--success)]",
    warning: "text-[var(--warning)]",
    error: "text-[var(--error)]",
    info: "text-[var(--info)]",
  }[tone ?? "info"];
  return (
    <div className="metric-tile">
      <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[var(--muted-foreground)]">{label}</p>
      <p className={`mt-1 break-words text-lg font-black ${tone ? toneClass : "text-[var(--foreground)]"}`}>{formatValue(value)}</p>
    </div>
  );
}

export function ChannelFetchProgress({
  status,
  pagesFetched,
  count,
  total,
  progress,
  coverage,
  persistence,
  persistenceWarning,
}: {
  status: string;
  pagesFetched: number;
  count: number;
  total: number | null;
  progress?: FetchProgressSummary | null;
  coverage?: ChannelCoverage | null;
  persistence: ChannelPersistenceMode;
  persistenceWarning: string | null;
}) {
  const persistenceLabel = !progress && status === "idle" && !persistenceWarning ? "Not started" : persistence === "database" && !persistenceWarning ? "Persisted" : "Runtime";
  const collectedUnique = coverage?.collectedUniqueVideos ?? progress?.uniqueItemsCollected ?? count;
  const estimatedRemaining = coverage?.estimatedRemainingVideos ?? (total !== null ? Math.max(total - collectedUnique, 0) : null);
  const coveragePercent = coverage?.coveragePercent ?? (total && total > 0 ? Math.min(100, Number(((collectedUnique / total) * 100).toFixed(2))) : null);
  const progressPercent = coveragePercent === null ? (progress?.status === "running" ? 36 : 0) : Math.max(0, Math.min(100, coveragePercent));
  const isRunning = status === "running" || status === "fetching";

  return (
    <Card className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[var(--border)] bg-[color-mix(in_srgb,var(--primary)_12%,transparent)] text-[var(--primary)]">
            {isRunning ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <Gauge className="h-5 w-5" aria-hidden="true" />}
          </span>
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--muted-foreground)]">Active Fetch Progress</p>
            <h2 className="mt-1 text-xl font-black">{status}</h2>
            <p className="mt-1 text-sm leading-6 text-[var(--muted-foreground)]">
              {progress?.parallelismEnabled ? "Independent date windows can run in parallel while each window keeps ordered page cursors." : "Progress reflects the current manifest and saved coverage state."}
            </p>
          </div>
        </div>
        <div className="min-w-0 text-right max-sm:text-left">
          <p className="text-4xl font-black text-[var(--primary)]">{coveragePercent === null ? "--" : `${coveragePercent.toFixed(2)}%`}</p>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--muted-foreground)]">Coverage</p>
        </div>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full border border-[var(--border)] bg-[var(--surface-container-high)]">
        <div
          className="h-full rounded-full bg-[var(--primary)] transition-[width] duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="metric-grid">
        <Metric label="Persistence" value={persistenceLabel} tone={persistenceLabel === "Persisted" ? "success" : "info"} />
        <Metric label="Attempt" value={progress ? `#${progress.attemptNumber}` : "None"} />
        <Metric label="Visible cards" value={count} />
        <Metric label="Collected unique" value={collectedUnique} tone="success" />
        <Metric label="Reported total" value={total ?? "Unknown"} />
        <Metric label="Estimated remaining" value={estimatedRemaining ?? "Unknown"} tone="info" />
        <Metric label="Pages fetched" value={pagesFetched} />
        <Metric label="Total API requests" value={progress?.totalApiRequests ?? 0} />
        <Metric label="Current page" value={progress?.currentPageNumber ?? "None"} />
        <Metric label="Current window" value={progress?.currentDateWindow ?? "None"} />
        <Metric label="Workers" value={progress ? `${progress.currentConcurrentWorkers}/${progress.maxConcurrentWorkers}` : "0/1"} />
        <Metric label="Queued windows" value={progress?.queuedWindowCount ?? progress?.windowsQueued ?? 0} />
        <Metric label="Completed windows" value={progress?.windowsCompleted ?? 0} tone="success" />
        <Metric label="Duplicates" value={progress?.duplicateCount ?? 0} tone="warning" />
        <Metric label="Capped windows" value={progress?.cappedWindowCount ?? 0} tone="warning" />
        <Metric label="Failed windows" value={progress?.failedWindowCount ?? 0} tone="error" />
        <Metric label="Completeness" value={progress?.completenessStatus ?? "unknown"} />
        <Metric label="Resume" value={progress?.resumable ? "Available" : "Unavailable"} />
      </div>

      {persistenceWarning ? (
        <div className="panel-muted flex items-start gap-3 p-3 text-sm leading-6 text-[var(--muted-foreground)]">
          <Database className="mt-0.5 h-4 w-4 shrink-0 text-[var(--warning)]" aria-hidden="true" />
          {persistenceWarning}
        </div>
      ) : null}
      {progress?.parallelismReason ? (
        <div className="panel-muted flex items-start gap-3 p-3 text-sm leading-6 text-[var(--muted-foreground)]">
          <Activity className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]" aria-hidden="true" />
          {progress.parallelismReason}
        </div>
      ) : null}
    </Card>
  );
}

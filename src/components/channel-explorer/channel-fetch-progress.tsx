import { Card } from "@/components/ui/card";
import type { ChannelCoverage, ChannelPersistenceMode, FetchProgressSummary } from "@/types/channel-fetch";

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
  const stats = [
    ["Status", status],
    ["Persistence", persistenceLabel],
    ["Attempt", progress ? `Attempt #${progress.attemptNumber}` : "None"],
    ["Page size / limit", progress?.pageSize ?? "100"],
    ["Pages fetched", pagesFetched],
    ["Total API requests", progress?.totalApiRequests ?? 0],
    ["Current page", progress?.currentPageNumber ?? "None"],
    ["Current date window", progress?.currentDateWindow ?? "None"],
    ["Visible result cards", count],
    ["Collected unique videos", collectedUnique],
    ["Reported total", total ?? "Unknown"],
    ["Estimated remaining", estimatedRemaining ?? "Unknown"],
    ["Coverage percent", coveragePercent === null ? "Unknown" : `${coveragePercent.toFixed(2)}%`],
    ["Profile", progress?.fetchProfile ?? "None"],
    ["Windows processed", progress?.windowsProcessed ?? 0],
    ["Active windows", progress?.activeWindowCount ?? 0],
    ["Queued windows", progress?.queuedWindowCount ?? progress?.windowsQueued ?? 0],
    ["Windows completed", progress?.windowsCompleted ?? 0],
    ["Concurrent workers", progress ? `${progress.currentConcurrentWorkers}/${progress.maxConcurrentWorkers}` : "0/1"],
    ["Duplicates", progress?.duplicateCount ?? 0],
    ["Capped windows", progress?.cappedWindowCount ?? 0],
    ["Failed windows", progress?.failedWindowCount ?? 0],
    ["Completeness", progress?.completenessStatus ?? "unknown"],
    ["Resume", progress?.resumable ? "Available" : "Unavailable"],
    ["Last checkpoint", progress?.lastCheckpoint ?? "None"],
  ];

  return (
    <Card className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(([label, value]) => (
          <div key={label}>
            <p className="text-xs font-semibold uppercase text-[var(--muted-foreground)]">{label}</p>
            <p className="mt-1 text-lg font-bold">{value}</p>
          </div>
        ))}
      </div>
      {persistenceWarning ? (
        <div className="rounded-md border border-[var(--border)] bg-[var(--surface-muted)] p-3 text-sm leading-6 text-[var(--muted-foreground)]">{persistenceWarning}</div>
      ) : null}
      {progress?.parallelismReason ? (
        <div className="rounded-md border border-[var(--border)] bg-[var(--surface-muted)] p-3 text-sm leading-6 text-[var(--muted-foreground)]">{progress.parallelismReason}</div>
      ) : null}
    </Card>
  );
}

import { Card } from "@/components/ui/card";
import type { ChannelPersistenceMode, FetchProgressSummary } from "@/types/channel-fetch";

export function ChannelFetchProgress({
  status,
  pagesFetched,
  count,
  total,
  progress,
  persistence,
  persistenceWarning,
}: {
  status: string;
  pagesFetched: number;
  count: number;
  total: number | null;
  progress?: FetchProgressSummary | null;
  persistence: ChannelPersistenceMode;
  persistenceWarning: string | null;
}) {
  const persistenceLabel = !progress && status === "idle" && !persistenceWarning ? "Not started" : persistence === "database" && !persistenceWarning ? "Persisted" : "Runtime";
  const stats = [
    ["Status", status],
    ["Persistence", persistenceLabel],
    ["Pages fetched", pagesFetched],
    ["Videos collected", count],
    ["Reported total", total ?? "Unknown"],
    ["Profile", progress?.fetchProfile ?? "None"],
    ["Windows processed", progress?.windowsProcessed ?? 0],
    ["Windows queued", progress?.windowsQueued ?? 0],
    ["Duplicates", progress?.duplicateCount ?? 0],
    ["Capped windows", progress?.cappedWindowCount ?? 0],
    ["Failed windows", progress?.failedWindowCount ?? 0],
    ["Completeness", progress?.completenessStatus ?? "unknown"],
    ["Resume", progress?.resumable ? "Available" : "Unavailable"],
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
    </Card>
  );
}

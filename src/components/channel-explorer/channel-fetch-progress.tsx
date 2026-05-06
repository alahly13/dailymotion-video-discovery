import { Card } from "@/components/ui/card";
import type { FetchProgressSummary } from "@/types/channel-fetch";

export function ChannelFetchProgress({
  status,
  pagesFetched,
  count,
  total,
  progress,
}: {
  status: string;
  pagesFetched: number;
  count: number;
  total: number | null;
  progress?: FetchProgressSummary | null;
}) {
  const stats = [
    ["Status", status],
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
    <Card className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map(([label, value]) => (
        <div key={label}>
          <p className="text-xs font-semibold uppercase text-[var(--muted-foreground)]">{label}</p>
          <p className="mt-1 text-lg font-bold">{value}</p>
        </div>
      ))}
    </Card>
  );
}

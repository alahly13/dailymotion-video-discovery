import { AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { ChannelCoverage, ChannelPersistenceMode } from "@/types/channel-fetch";

function valueText(value: string | number | null | undefined) {
  return value === null || value === undefined || value === "" ? "Unavailable" : value;
}

export function ChannelCoveragePanel({ coverage, persistence, persistenceWarning }: { coverage: ChannelCoverage | null; persistence: ChannelPersistenceMode; persistenceWarning: string | null }) {
  const persisted = persistence === "database" && !persistenceWarning;
  const persistenceCopy = persisted || (!coverage && !persistenceWarning)
    ? "Coverage snapshots are stored in the database when manifest persistence is enabled."
    : persistenceWarning ?? "Persistence unavailable: history may reset after restart/deploy.";
  const stats = [
    ["Reported total from Dailymotion", coverage?.reportedTotalFromApi ?? "Unavailable"],
    ["Collected unique public videos", coverage?.collectedUniqueVideos ?? 0],
    ["Estimated remaining", coverage?.estimatedRemainingVideos ?? "Unavailable"],
    ["Coverage percent", coverage?.coveragePercent !== null && coverage?.coveragePercent !== undefined ? `${coverage.coveragePercent.toFixed(2)}%` : "Unavailable"],
    ["Completeness", coverage?.coverageStatus ?? "unknown"],
    ["Confidence", coverage?.coverageConfidence ?? "unknown"],
    ["Capped windows", coverage?.cappedWindowCount ?? 0],
    ["Failed windows", coverage?.failedWindowCount ?? 0],
    ["Pending windows", coverage?.pendingWindowCount ?? 0],
    ["Latest checkpoint", valueText(coverage?.latestSuccessfulCheckpoint)],
    ["Last resume point", valueText(coverage?.lastResumePoint)],
  ];

  return (
    <Card className="space-y-4">
      <div>
        <h2 className="text-lg font-bold">Channel Coverage</h2>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--muted-foreground)]">
          Reported total depends on what Dailymotion exposes for this endpoint. If unavailable, the app shows collected unique videos and coverage status instead.
        </p>
      </div>
      <div className="rounded-md border border-[var(--border)] bg-[var(--surface-muted)] p-3 text-sm leading-6 text-[var(--muted-foreground)]">
        {persistenceCopy}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(([label, value]) => (
          <div key={label}>
            <p className="text-xs font-semibold uppercase text-[var(--muted-foreground)]">{label}</p>
            <p className="mt-1 break-words text-sm font-bold">{value}</p>
          </div>
        ))}
      </div>
      <div className="flex items-start gap-3 rounded-md border border-[var(--border)] bg-[var(--surface-muted)] p-3 text-sm leading-6 text-[var(--muted-foreground)]">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" aria-hidden="true" />
        <p>{coverage?.warning ?? "Full channel coverage is only confirmed when every planned time window completes without caps or failures."}</p>
      </div>
    </Card>
  );
}

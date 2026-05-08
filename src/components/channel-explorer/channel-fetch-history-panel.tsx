"use client";

import { History, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ChannelPersistenceMode, FetchHistoryEntry } from "@/types/channel-fetch";

function Badge({ label }: { label: string }) {
  return <span className="metadata-chip rounded-md border border-[var(--border)] bg-[var(--surface-container-low)] px-2 py-1 text-xs font-black uppercase text-[var(--muted-foreground)]">{label}</span>;
}

export function ChannelFetchHistoryPanel({
  history,
  activeJobId,
  loading,
  persistence,
  persistenceWarning,
  onResume,
}: {
  history: FetchHistoryEntry[];
  activeJobId: string | null;
  loading: boolean;
  persistence: ChannelPersistenceMode;
  persistenceWarning: string | null;
  onResume: (jobId: string) => void;
}) {
  const persisted = persistence === "database" && !persistenceWarning;
  const persistenceCopy = persisted || (history.length === 0 && !persistenceWarning)
    ? "History and resume checkpoints are stored in the database when manifest persistence is enabled."
    : persistenceWarning ?? "Persistence unavailable: history may reset after restart/deploy.";

  return (
    <Card className="space-y-5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[var(--border)] bg-[color-mix(in_srgb,var(--primary)_12%,transparent)] text-[var(--primary)]">
          <History className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--muted-foreground)]">Fetch Attempts / History</p>
          <h2 className="mt-1 text-xl font-black">Attempt Timeline</h2>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--muted-foreground)]">
          History tracks fetch runs and resume checkpoints. Result filters only filter the current collected manifest.
          Fetch attempts are numbered so you can track what was collected in each run.
        </p>
        </div>
      </div>

      <div className="panel-muted p-3 text-sm leading-6 text-[var(--muted-foreground)]">
        {persistenceCopy}
      </div>

      {history.length === 0 ? (
        <div className="rounded-md border border-dashed border-[var(--border)] bg-[var(--surface-container-low)] p-4 text-sm text-[var(--muted-foreground)]">
          No fetch runs for this source are available yet.
        </div>
      ) : (
        <div className="grid gap-3">
          {history.map((entry) => (
            <div key={entry.id} className="grid min-w-0 gap-3 rounded-md border border-[var(--border)] bg-[var(--surface-container-low)] p-4 transition hover:border-[var(--border-strong)] 2xl:grid-cols-[minmax(0,1fr)_auto]">
              <div className="metric-grid">
                <div className="metric-tile">
                  <p className="text-xs font-semibold uppercase text-[var(--muted-foreground)]">Attempt</p>
                  <p className="mt-1 text-sm font-bold">Attempt #{entry.attemptNumber}</p>
                </div>
                <div className="metric-tile">
                  <p className="text-xs font-semibold uppercase text-[var(--muted-foreground)]">Profile</p>
                  <p className="mt-1 text-sm font-bold">{entry.fetchProfile}</p>
                </div>
                <div className="metric-tile">
                  <p className="text-xs font-semibold uppercase text-[var(--muted-foreground)]">Status</p>
                  <p className="mt-1 text-sm font-bold">{entry.completenessStatus}</p>
                </div>
                <div className="metric-tile">
                  <p className="text-xs font-semibold uppercase text-[var(--muted-foreground)]">Added / duplicates</p>
                  <p className="mt-1 text-sm font-bold">{entry.uniqueItemsCollected} / {entry.duplicateCount}</p>
                </div>
                <div className="metric-tile">
                  <p className="text-xs font-semibold uppercase text-[var(--muted-foreground)]">Pages</p>
                  <p className="mt-1 text-sm font-bold">{entry.pagesFetched}</p>
                </div>
                <div className="metric-tile">
                  <p className="text-xs font-semibold uppercase text-[var(--muted-foreground)]">Windows</p>
                  <p className="mt-1 text-sm font-bold">{entry.windowsProcessed} done, {entry.cappedWindowCount} capped, {entry.failedWindowCount} failed</p>
                </div>
                <div className="metric-tile">
                  <p className="text-xs font-semibold uppercase text-[var(--muted-foreground)]">Current resume checkpoint</p>
                  <p className="text-anywhere mt-1 text-sm font-bold">{entry.currentResumeCheckpoint ?? "Unavailable"}</p>
                </div>
                <div className="chip-row sm:col-span-2">
                  <Badge label={entry.persistence === "database" ? "Persisted" : "Runtime"} />
                  <Badge label={entry.persistenceType ?? "Temporary"} />
                  {entry.resumable ? <Badge label="Resumable" /> : null}
                  {entry.completenessStatus === "complete" ? <Badge label="Complete" /> : null}
                  {entry.completenessStatus === "partial" ? <Badge label="Partial" /> : null}
                  {entry.completenessStatus === "capped" ? <Badge label="Capped" /> : null}
                  {entry.status === "failed" ? <Badge label="Failed" /> : null}
                  {entry.status === "stopped" ? <Badge label="Stopped" /> : null}
                </div>
              </div>
              <div className="action-row items-center 2xl:justify-end">
                {entry.resumable ? (
                  <Button type="button" variant={entry.id === activeJobId ? "secondary" : "primary"} onClick={() => onResume(entry.id)} disabled={loading}>
                    <Play className="h-4 w-4" aria-hidden="true" />
                    Resume
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

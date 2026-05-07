"use client";

import { History, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ChannelPersistenceMode, FetchHistoryEntry } from "@/types/channel-fetch";

function Badge({ label }: { label: string }) {
  return <span className="rounded-md border border-[var(--border)] bg-[var(--surface-muted)] px-2 py-1 text-xs font-bold uppercase text-[var(--muted-foreground)]">{label}</span>;
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
    <Card className="space-y-4">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <History className="h-4 w-4 text-[var(--accent)]" aria-hidden="true" />
          Fetch History
        </h2>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--muted-foreground)]">
          History tracks fetch runs and resume checkpoints. Result filters only filter the current collected manifest.
          Fetch attempts are numbered so you can track what was collected in each run.
        </p>
      </div>

      <div className="rounded-md border border-[var(--border)] bg-[var(--surface-muted)] p-3 text-sm leading-6 text-[var(--muted-foreground)]">
        {persistenceCopy}
      </div>

      {history.length === 0 ? (
        <div className="rounded-md border border-dashed border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--muted-foreground)]">
          No fetch runs for this source are available yet.
        </div>
      ) : (
        <div className="grid gap-3">
          {history.map((entry) => (
            <div key={entry.id} className="grid gap-3 rounded-md border border-[var(--border)] bg-[var(--background-elevated)] p-4 lg:grid-cols-[1fr_auto]">
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-xs font-semibold uppercase text-[var(--muted-foreground)]">Attempt</p>
                  <p className="mt-1 text-sm font-bold">Attempt #{entry.attemptNumber}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-[var(--muted-foreground)]">Profile</p>
                  <p className="mt-1 text-sm font-bold">{entry.fetchProfile}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-[var(--muted-foreground)]">Status</p>
                  <p className="mt-1 text-sm font-bold">{entry.completenessStatus}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-[var(--muted-foreground)]">Added / duplicates</p>
                  <p className="mt-1 text-sm font-bold">{entry.uniqueItemsCollected} / {entry.duplicateCount}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-[var(--muted-foreground)]">Pages</p>
                  <p className="mt-1 text-sm font-bold">{entry.pagesFetched}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-[var(--muted-foreground)]">Windows</p>
                  <p className="mt-1 text-sm font-bold">{entry.windowsProcessed} done, {entry.cappedWindowCount} capped, {entry.failedWindowCount} failed</p>
                </div>
                <div className="sm:col-span-2 lg:col-span-4">
                  <p className="text-xs font-semibold uppercase text-[var(--muted-foreground)]">Current resume checkpoint</p>
                  <p className="mt-1 break-all text-sm font-bold">{entry.currentResumeCheckpoint ?? "Unavailable"}</p>
                </div>
                <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-4">
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
              <div className="flex items-center gap-2">
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

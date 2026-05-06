"use client";

import { History, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { FetchHistoryEntry } from "@/types/channel-fetch";

export function ChannelFetchHistoryPanel({
  history,
  activeJobId,
  loading,
  onResume,
}: {
  history: FetchHistoryEntry[];
  activeJobId: string | null;
  loading: boolean;
  onResume: (jobId: string) => void;
}) {
  return (
    <Card className="space-y-4">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <History className="h-4 w-4 text-[var(--accent)]" aria-hidden="true" />
          Fetch History
        </h2>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--muted-foreground)]">
          History tracks fetch runs and resume checkpoints. Result filters only filter the current collected manifest.
        </p>
      </div>

      <div className="rounded-md border border-[var(--border)] bg-[var(--surface-muted)] p-3 text-sm leading-6 text-[var(--muted-foreground)]">
        Runtime history is kept in server memory until database migrations and repository persistence are applied. It can resume jobs while the same runtime keeps the checkpoint.
      </div>

      {history.length === 0 ? (
        <div className="rounded-md border border-dashed border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--muted-foreground)]">
          No fetch runs for this source in the current runtime session.
        </div>
      ) : (
        <div className="grid gap-3">
          {history.map((entry) => (
            <div key={entry.id} className="grid gap-3 rounded-md border border-[var(--border)] bg-[var(--background-elevated)] p-4 lg:grid-cols-[1fr_auto]">
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-xs font-semibold uppercase text-[var(--muted-foreground)]">Profile</p>
                  <p className="mt-1 text-sm font-bold">{entry.fetchProfile}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-[var(--muted-foreground)]">Status</p>
                  <p className="mt-1 text-sm font-bold">{entry.completenessStatus}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-[var(--muted-foreground)]">Unique / pages</p>
                  <p className="mt-1 text-sm font-bold">{entry.uniqueItemsCollected} / {entry.pagesFetched}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-[var(--muted-foreground)]">Windows</p>
                  <p className="mt-1 text-sm font-bold">{entry.windowsProcessed} done, {entry.cappedWindowCount} capped, {entry.failedWindowCount} failed</p>
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

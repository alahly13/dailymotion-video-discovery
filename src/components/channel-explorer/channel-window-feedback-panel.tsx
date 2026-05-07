"use client";

import { AlertTriangle, CalendarClock, CheckCircle2, Clock3, Loader2, Play, Split } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FetchPageAttemptSummary, FetchProgressSummary, FetchWindowSummary, FetchWindowStatus } from "@/types/channel-fetch";

function statusClasses(status: FetchWindowStatus) {
  if (status === "complete") return "border-[var(--success)]";
  if (status === "failed" || status === "stopped" || status === "capped") return "border-[var(--danger)]";
  if (status === "running") return "border-[var(--accent)]";
  return "border-[var(--border)]";
}

function statusIcon(status: FetchWindowStatus) {
  if (status === "complete") return CheckCircle2;
  if (status === "running") return Loader2;
  if (status === "split") return Split;
  if (status === "failed" || status === "stopped" || status === "capped") return AlertTriangle;
  return Clock3;
}

function shortDate(value: string | null) {
  return value ? value.slice(0, 10) : "open";
}

function windowTitle(window: FetchWindowSummary) {
  if (!window.windowStart && !window.windowEnd) return "All dates window";
  const start = window.windowStart ? new Date(window.windowStart) : null;
  if (window.unit === "year" && start && !Number.isNaN(start.valueOf())) return `${start.getUTCFullYear()} window`;
  if (window.unit === "month" && start && !Number.isNaN(start.valueOf())) return `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, "0")} window`;
  return `${shortDate(window.windowStart)} window`;
}

function completionCopy(window: FetchWindowSummary) {
  if (window.status === "complete") return `Successfully fetched ${windowTitle(window)}.`;
  if (window.status === "capped") return "This window reached the provider cap. Resume or split strategy may be needed before claiming full coverage.";
  if (window.status === "split") return "This window reached provider cap and was split into smaller windows.";
  if (window.status === "failed") return window.errorMessage ?? "This window failed with a safe provider/network error.";
  if (window.status === "stopped") return "This window was stopped and can resume from the latest saved checkpoint when available.";
  if (window.status === "running") return "This window is currently receiving its next ordered page.";
  return "Queued for a future chunk.";
}

function compareWindowChronology(a: FetchWindowSummary, b: FetchWindowSummary) {
  const left = a.windowStart ? Date.parse(a.windowStart) : Number.MAX_SAFE_INTEGER;
  const right = b.windowStart ? Date.parse(b.windowStart) : Number.MAX_SAFE_INTEGER;
  if (left !== right) return left - right;
  return (a.executionOrder ?? Number.MAX_SAFE_INTEGER) - (b.executionOrder ?? Number.MAX_SAFE_INTEGER);
}

export function ChannelWindowFeedbackPanel({
  windows,
  recentPageAttempts,
  progress,
  resumable,
  onResume,
}: {
  windows: FetchWindowSummary[];
  recentPageAttempts: FetchPageAttemptSummary[];
  progress: FetchProgressSummary | null;
  resumable: boolean;
  onResume: () => void;
}) {
  const orderedWindows = [...windows].sort(compareWindowChronology);
  const activeCount = progress?.activeWindowCount ?? orderedWindows.filter((window) => window.status === "running").length;
  const queuedCount = progress?.queuedWindowCount ?? orderedWindows.filter((window) => window.status === "pending").length;

  return (
    <section className="space-y-4" aria-labelledby="window-feedback-heading">
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow)] backdrop-blur">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 id="window-feedback-heading" className="flex items-center gap-2 text-xl font-black">
              <CalendarClock className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
              Fetch Timeline / Window Feedback
            </h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--muted-foreground)]">
              Each card is a persisted fetch window summary. Parallel execution changes execution order, not the ordered page cursor inside an individual window.
            </p>
          </div>
          <div className="grid gap-2 text-sm font-semibold text-[var(--muted-foreground)] sm:grid-cols-4 lg:min-w-[34rem]">
            <span>Active {activeCount}</span>
            <span>Queued {queuedCount}</span>
            <span>Completed {progress?.windowsCompleted ?? 0}</span>
            <span>Workers {progress?.currentConcurrentWorkers ?? 0}/{progress?.maxConcurrentWorkers ?? 1}</span>
          </div>
        </div>

        {progress?.parallelismReason ? (
          <div className="mt-4 rounded-md border border-[var(--border)] bg-[var(--surface-muted)] p-3 text-sm leading-6 text-[var(--muted-foreground)]">
            {progress.parallelismReason}
          </div>
        ) : null}

        {orderedWindows.length === 0 ? (
          <div className="mt-4 rounded-md border border-dashed border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--muted-foreground)]">
            No fetch windows have been planned yet.
          </div>
        ) : (
          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            {orderedWindows.map((window) => {
              const Icon = statusIcon(window.status);
              const running = window.status === "running";
              return (
                <div key={window.id} className={`space-y-3 rounded-md border bg-[var(--background-elevated)] p-4 ${statusClasses(window.status)}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="flex items-center gap-2 text-base font-black">
                        <Icon className={`h-4 w-4 text-[var(--accent)] ${running ? "animate-spin" : ""}`} aria-hidden="true" />
                        {windowTitle(window)}
                      </h3>
                      <p className="mt-1 text-sm text-[var(--muted-foreground)]">Window: {shortDate(window.windowStart)} -&gt; {shortDate(window.windowEnd)}</p>
                    </div>
                    <div className="flex flex-wrap justify-end gap-2">
                      <span className="rounded-md border border-[var(--border)] bg-[var(--surface-muted)] px-2 py-1 text-xs font-bold uppercase text-[var(--muted-foreground)]">{window.status}</span>
                      {window.executionOrder ? <span className="rounded-md border border-[var(--border)] bg-[var(--surface-muted)] px-2 py-1 text-xs font-bold uppercase text-[var(--muted-foreground)]">Exec #{window.executionOrder}</span> : null}
                    </div>
                  </div>

                  <div className="grid gap-2 text-sm text-[var(--muted-foreground)] sm:grid-cols-2">
                    <span>Pages fetched: <strong className="text-[var(--foreground)]">{window.pagesFetched}</strong></span>
                    <span>Videos returned: <strong className="text-[var(--foreground)]">{window.itemsFound}</strong></span>
                    <span>Unique added: <strong className="text-[var(--foreground)]">{window.uniqueItemsAdded}</strong></span>
                    <span>Duplicates skipped: <strong className="text-[var(--foreground)]">{window.duplicateItemsFound}</strong></span>
                  </div>

                  <p className="text-sm leading-6 text-[var(--muted-foreground)]">{completionCopy(window)}</p>
                  {(window.status === "failed" || window.status === "stopped" || window.status === "capped") && resumable ? (
                    <Button type="button" variant="secondary" onClick={onResume}>
                      <Play className="h-4 w-4" aria-hidden="true" />
                      Resume Fetch
                    </Button>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}

        {recentPageAttempts.length > 0 ? (
          <div className="mt-5 rounded-md border border-[var(--border)] bg-[var(--surface-muted)] p-4">
            <h3 className="text-sm font-black uppercase text-[var(--muted-foreground)]">Recent page groups</h3>
            <div className="mt-3 grid gap-2 text-sm text-[var(--muted-foreground)] lg:grid-cols-2">
              {recentPageAttempts.map((attempt) => (
                <div key={attempt.id} className="rounded-md border border-[var(--border)] bg-[var(--background-elevated)] p-3">
                  Page {attempt.pageNumber} - {attempt.status} - {attempt.itemsReturned} returned, {attempt.uniqueItemsAdded} unique, {attempt.duplicateItemsFound} duplicates
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

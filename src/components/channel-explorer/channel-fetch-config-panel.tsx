"use client";

import { CalendarClock, Play, RotateCcw, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";
import type { ChannelFetchSettings, FetchSafetyCaps, TimeWindowUnit } from "@/types/channel-fetch";

const fetchProfiles = [
  ["quick-preview", "Quick Preview"],
  ["standard-fetch", "Standard Fetch"],
  ["deep-balanced", "Deep Balanced"],
  ["deep-aggressive", "Deep Aggressive"],
  ["recent-sync", "Recent Sync"],
  ["historical-backfill", "Historical Backfill"],
  ["custom-expert", "Custom Expert"],
] as const;

const windowUnits: TimeWindowUnit[] = ["year", "month", "week", "day"];

function numberValue(value: string) {
  return value === "" ? 0 : Number(value);
}

function CheckboxRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex min-h-10 min-w-0 items-center gap-3 rounded-md border border-[var(--border)] bg-[var(--surface-container-low)] px-3 py-2 text-sm font-semibold text-[var(--muted-foreground)] transition hover:border-[var(--border-strong)]">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-[var(--accent)]" />
      <span className="min-w-0 break-words">{label}</span>
    </label>
  );
}

function NumberField({ label, value, min, max, onChange }: { label: string; value: number; min?: number; max?: number; onChange: (value: number) => void }) {
  return (
    <label className="min-w-0 space-y-1 text-sm font-semibold">
      <span>{label}</span>
      <Input type="number" min={min} max={max} value={value} onChange={(event) => onChange(numberValue(event.target.value))} />
    </label>
  );
}

export function ChannelFetchConfigPanel({
  settings,
  safetyCaps,
  loading,
  primaryLabel,
  primaryCopy,
  hasSavedAttempts,
  onChange,
  onStart,
  onStartNew,
  onReset,
}: {
  settings: ChannelFetchSettings;
  safetyCaps: FetchSafetyCaps | null;
  loading: boolean;
  primaryLabel: string;
  primaryCopy: string;
  hasSavedAttempts: boolean;
  onChange: (settings: ChannelFetchSettings) => void;
  onStart: () => void;
  onStartNew: () => void;
  onReset: () => void;
}) {
  const expertMode = settings.fetchProfile === "custom-expert";

  return (
    <Card className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[var(--border)] bg-[color-mix(in_srgb,var(--primary)_12%,transparent)] text-[var(--primary)]">
            <SlidersHorizontal className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--muted-foreground)]">Fetch Configuration</p>
            <h2 className="mt-1 text-xl font-black">Collection Parameters</h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--muted-foreground)]">
              Fetch settings control how public metadata is collected from Dailymotion. Result filters only filter videos already collected in the current manifest.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Button type="button" variant="ghost" onClick={onReset} disabled={loading} className="flex-1 sm:flex-none">
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Reset
          </Button>
          <Button type="button" onClick={onStart} disabled={loading} className="flex-1 sm:flex-none">
            <Play className="h-4 w-4" aria-hidden="true" />
            {primaryLabel}
          </Button>
          {hasSavedAttempts ? (
            <Button type="button" variant="secondary" onClick={onStartNew} disabled={loading} className="flex-1 sm:flex-none">
              <Play className="h-4 w-4" aria-hidden="true" />
              Start New Fetch
            </Button>
          ) : null}
        </div>
      </div>

      <div className="panel-muted p-3 text-sm leading-6 text-[var(--muted-foreground)]">
        <p className="font-semibold text-[var(--foreground)]">{primaryCopy}</p>
        <p>Fetch attempts are numbered so you can track what was collected in each run. Fetch Remaining continues from the last saved checkpoint instead of starting over.</p>
        {hasSavedAttempts ? <p>Start New Fetch creates a separate new attempt from the beginning and does not delete the saved channel manifest.</p> : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
        {fetchProfiles.map(([value, label]) => (
          <button
            key={value}
            type="button"
            disabled={loading}
            onClick={() => onChange({ ...settings, fetchProfile: value })}
            className={cn(
              "min-h-11 min-w-0 rounded-md border px-3 py-2 text-left text-xs font-black uppercase tracking-[0.08em] transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring)] disabled:opacity-60",
              settings.fetchProfile === value
                ? "border-[var(--primary)] bg-[color-mix(in_srgb,var(--primary)_14%,transparent)] text-[var(--foreground)]"
                : "border-[var(--border)] bg-[var(--surface-container-low)] text-[var(--muted-foreground)] hover:border-[var(--border-strong)] hover:text-[var(--foreground)]"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="panel-muted p-3 text-sm leading-6 text-[var(--muted-foreground)]">
        Dailymotion can cap a single result window around 1000 videos. Deep Fetch splits public metadata by date windows when supported. Window concurrency only runs independent date windows; pages inside a window remain ordered for resume safety.
      </div>

      <div className="control-grid">
        <label className="min-w-0 space-y-1 text-sm font-semibold">
          <span>From date</span>
          <Input type="date" value={settings.fromDate ?? ""} onChange={(event) => onChange({ ...settings, fromDate: event.target.value || null })} />
        </label>
        <label className="min-w-0 space-y-1 text-sm font-semibold">
          <span>To date</span>
          <Input type="date" value={settings.toDate ?? ""} onChange={(event) => onChange({ ...settings, toDate: event.target.value || null })} />
        </label>
      </div>

      <div className="control-grid">
        <NumberField label="Max videos" min={1} max={safetyCaps?.maxItems} value={settings.maxItems} onChange={(value) => onChange({ ...settings, maxItems: value })} />
        <NumberField label="Max total pages" min={1} max={safetyCaps?.maxTotalPages} value={settings.maxTotalPages} onChange={(value) => onChange({ ...settings, maxTotalPages: value })} />
        <NumberField label="Max windows" min={1} max={safetyCaps?.maxWindows} value={settings.maxWindows} onChange={(value) => onChange({ ...settings, maxWindows: value })} />
        <NumberField label="Page size" min={1} max={safetyCaps?.maxPageSize ?? 100} value={settings.pageSize} onChange={(value) => onChange({ ...settings, pageSize: value })} />
        <NumberField label="Window concurrency" min={1} max={safetyCaps?.maxConcurrency ?? 1} value={settings.concurrency} onChange={(value) => onChange({ ...settings, concurrency: value })} />
        <NumberField label="Delay ms" min={safetyCaps?.minDelayMs ?? 0} value={settings.delayMs} onChange={(value) => onChange({ ...settings, delayMs: value })} />
      </div>

      <div className="control-grid">
        <label className="min-w-0 space-y-1 text-sm font-semibold">
          <span>Initial window unit</span>
          <select
            className="min-h-11 w-full min-w-0 rounded-md border border-[var(--border)] bg-[var(--surface-container-low)] px-4 text-sm outline-none transition focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--ring)]"
            value={settings.initialWindowUnit}
            onChange={(event) => onChange({ ...settings, initialWindowUnit: event.target.value as TimeWindowUnit })}
          >
            <option value="all">Single result window</option>
            {windowUnits.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </select>
        </label>
        <label className="min-w-0 space-y-1 text-sm font-semibold">
          <span>Minimum split unit</span>
          <select
            className="min-h-11 w-full min-w-0 rounded-md border border-[var(--border)] bg-[var(--surface-container-low)] px-4 text-sm outline-none transition focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--ring)]"
            value={settings.minimumSplitUnit}
            onChange={(event) => onChange({ ...settings, minimumSplitUnit: event.target.value as ChannelFetchSettings["minimumSplitUnit"] })}
          >
            {windowUnits.filter((unit) => unit !== "year").map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="control-grid">
        <CheckboxRow label="Auto-split capped windows" checked={settings.autoSplitCappedWindows} onChange={(value) => onChange({ ...settings, autoSplitCappedWindows: value })} />
        <CheckboxRow label="Preserve partial manifest" checked={settings.preservePartialManifest} onChange={(value) => onChange({ ...settings, preservePartialManifest: value })} />
        <CheckboxRow label="Stop at max videos" checked={settings.stopWhenMaxItemsReached} onChange={(value) => onChange({ ...settings, stopWhenMaxItemsReached: value })} />
        <CheckboxRow label="Stop on capped window" checked={settings.stopOnCappedWindow} onChange={(value) => onChange({ ...settings, stopOnCappedWindow: value })} />
      </div>

      {expertMode ? (
        <div className="flex items-start gap-3 rounded-md border border-[var(--border)] bg-[color-mix(in_srgb,var(--info)_10%,transparent)] p-3 text-sm leading-6 text-[var(--muted-foreground)]">
          <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-[var(--info)]" aria-hidden="true" />
          <p>Custom Expert values are still clamped by server hard caps. The browser cannot request unlimited pages, windows, items, or zero-delay fetches.</p>
        </div>
      ) : null}
    </Card>
  );
}

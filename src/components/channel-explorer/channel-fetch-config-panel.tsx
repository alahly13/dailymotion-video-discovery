"use client";

import { CalendarClock, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
    <label className="flex min-h-10 items-center gap-3 rounded-md border border-[var(--border)] bg-[var(--background-elevated)] px-3 text-sm font-semibold">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-[var(--accent)]" />
      <span>{label}</span>
    </label>
  );
}

function NumberField({ label, value, min, max, onChange }: { label: string; value: number; min?: number; max?: number; onChange: (value: number) => void }) {
  return (
    <label className="space-y-1 text-sm font-semibold">
      <span>{label}</span>
      <Input type="number" min={min} max={max} value={value} onChange={(event) => onChange(numberValue(event.target.value))} />
    </label>
  );
}

export function ChannelFetchConfigPanel({
  settings,
  safetyCaps,
  loading,
  onChange,
  onStart,
  onReset,
}: {
  settings: ChannelFetchSettings;
  safetyCaps: FetchSafetyCaps | null;
  loading: boolean;
  onChange: (settings: ChannelFetchSettings) => void;
  onStart: () => void;
  onReset: () => void;
}) {
  const expertMode = settings.fetchProfile === "custom-expert";

  return (
    <Card className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold">Fetch Configuration</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--muted-foreground)]">
            Fetch settings control how public metadata is collected from Dailymotion. Result filters only filter videos already collected in the current manifest.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="ghost" onClick={onReset} disabled={loading}>
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Reset
          </Button>
          <Button type="button" onClick={onStart} disabled={loading}>
            <Play className="h-4 w-4" aria-hidden="true" />
            Start New Fetch
          </Button>
        </div>
      </div>

      <div className="rounded-md border border-[var(--border)] bg-[var(--surface-muted)] p-3 text-sm leading-6 text-[var(--muted-foreground)]">
        Dailymotion can cap a single result window around 1000 videos. Deep Fetch splits public metadata by date windows when supported.
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <label className="space-y-1 text-sm font-semibold">
          <span>Fetch profile</span>
          <select
            className="min-h-11 w-full rounded-md border border-[var(--border)] bg-[var(--background-elevated)] px-4 text-sm outline-none transition focus:ring-4 focus:ring-[var(--ring)]"
            value={settings.fetchProfile}
            onChange={(event) => onChange({ ...settings, fetchProfile: event.target.value as ChannelFetchSettings["fetchProfile"] })}
          >
            {fetchProfiles.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm font-semibold">
          <span>From date</span>
          <Input type="date" value={settings.fromDate ?? ""} onChange={(event) => onChange({ ...settings, fromDate: event.target.value || null })} />
        </label>
        <label className="space-y-1 text-sm font-semibold">
          <span>To date</span>
          <Input type="date" value={settings.toDate ?? ""} onChange={(event) => onChange({ ...settings, toDate: event.target.value || null })} />
        </label>
      </div>

      <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-5">
        <NumberField label="Max videos" min={1} max={safetyCaps?.maxItems} value={settings.maxItems} onChange={(value) => onChange({ ...settings, maxItems: value })} />
        <NumberField label="Max total pages" min={1} max={safetyCaps?.maxTotalPages} value={settings.maxTotalPages} onChange={(value) => onChange({ ...settings, maxTotalPages: value })} />
        <NumberField label="Max windows" min={1} max={safetyCaps?.maxWindows} value={settings.maxWindows} onChange={(value) => onChange({ ...settings, maxWindows: value })} />
        <NumberField label="Page size" min={1} max={safetyCaps?.maxPageSize ?? 100} value={settings.pageSize} onChange={(value) => onChange({ ...settings, pageSize: value })} />
        <NumberField label="Delay ms" min={safetyCaps?.minDelayMs ?? 0} value={settings.delayMs} onChange={(value) => onChange({ ...settings, delayMs: value })} />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-1 text-sm font-semibold">
          <span>Initial window unit</span>
          <select
            className="min-h-11 w-full rounded-md border border-[var(--border)] bg-[var(--background-elevated)] px-4 text-sm outline-none transition focus:ring-4 focus:ring-[var(--ring)]"
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
        <label className="space-y-1 text-sm font-semibold">
          <span>Minimum split unit</span>
          <select
            className="min-h-11 w-full rounded-md border border-[var(--border)] bg-[var(--background-elevated)] px-4 text-sm outline-none transition focus:ring-4 focus:ring-[var(--ring)]"
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

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <CheckboxRow label="Auto-split capped windows" checked={settings.autoSplitCappedWindows} onChange={(value) => onChange({ ...settings, autoSplitCappedWindows: value })} />
        <CheckboxRow label="Preserve partial manifest" checked={settings.preservePartialManifest} onChange={(value) => onChange({ ...settings, preservePartialManifest: value })} />
        <CheckboxRow label="Stop at max videos" checked={settings.stopWhenMaxItemsReached} onChange={(value) => onChange({ ...settings, stopWhenMaxItemsReached: value })} />
        <CheckboxRow label="Stop on capped window" checked={settings.stopOnCappedWindow} onChange={(value) => onChange({ ...settings, stopOnCappedWindow: value })} />
      </div>

      {expertMode ? (
        <div className="flex items-start gap-3 rounded-md border border-[var(--border)] bg-[var(--surface-muted)] p-3 text-sm leading-6 text-[var(--muted-foreground)]">
          <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" aria-hidden="true" />
          <p>Custom Expert values are still clamped by server hard caps. The browser cannot request unlimited pages, windows, items, or zero-delay fetches.</p>
        </div>
      ) : null}
    </Card>
  );
}

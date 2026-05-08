"use client";

import { Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export type ChannelExplorerSearchScope = "current" | "combined" | "attempt";

export function ChannelManifestSearchPanel({
  query,
  scope,
  exactPhrase,
  fuzzy,
  sourceCount,
  matchedCount,
  filteredCount,
  sourceLabel,
  onQueryChange,
  onScopeChange,
  onExactPhraseChange,
  onFuzzyChange,
}: {
  query: string;
  scope: ChannelExplorerSearchScope;
  exactPhrase: boolean;
  fuzzy: boolean;
  sourceCount: number;
  matchedCount: number;
  filteredCount: number;
  sourceLabel: string;
  onQueryChange: (value: string) => void;
  onScopeChange: (value: ChannelExplorerSearchScope) => void;
  onExactPhraseChange: (value: boolean) => void;
  onFuzzyChange: (value: boolean) => void;
}) {
  return (
    <Card className="space-y-5" id="manifest-search">
      <div className="flex flex-col gap-3 2xl:flex-row 2xl:items-start 2xl:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[var(--border)] bg-[color-mix(in_srgb,var(--primary)_12%,transparent)] text-[var(--primary)]">
            <Search className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--muted-foreground)]">Search Current Results</p>
            <h2 className="mt-1 text-xl font-black">Manifest Search</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--muted-foreground)]">
            Search looks inside videos already collected. Filters refine the searched results. Neither action calls Dailymotion.
          </p>
          </div>
        </div>
        <div className="text-anywhere rounded-md border border-[color-mix(in_srgb,var(--success)_28%,transparent)] bg-[color-mix(in_srgb,var(--success)_10%,transparent)] px-3 py-2 text-xs font-black uppercase text-[var(--success)]">
          Search does not call Dailymotion
        </div>
      </div>

      <div className="control-grid">
        <label className="min-w-0 space-y-1 text-sm font-semibold">
          <span>Search collected results</span>
          <Input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Search title, description, owner, tags, Arabic, English, year, views, attempt..." />
        </label>
        <label className="min-w-0 space-y-1 text-sm font-semibold">
          <span>Search mode</span>
          <select value={scope} onChange={(event) => onScopeChange(event.target.value as ChannelExplorerSearchScope)} className="min-h-11 w-full min-w-0 rounded-md border border-[var(--border)] bg-[var(--surface-container-low)] px-4 text-sm outline-none transition focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--ring)]">
            <option value="current">Current live results</option>
            <option value="combined">Combined saved manifest</option>
            <option value="attempt">Selected attempt</option>
          </select>
        </label>
      </div>

      <div className="chip-row items-center">
        <label className="inline-flex min-h-10 items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface-container-low)] px-3 text-sm font-semibold text-[var(--muted-foreground)]">
          <input type="checkbox" checked={exactPhrase} onChange={(event) => onExactPhraseChange(event.target.checked)} className="h-4 w-4 accent-[var(--accent)]" />
          Exact phrase
        </label>
        <label className="inline-flex min-h-10 items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface-container-low)] px-3 text-sm font-semibold text-[var(--muted-foreground)]">
          <input type="checkbox" checked={fuzzy} onChange={(event) => onFuzzyChange(event.target.checked)} className="h-4 w-4 accent-[var(--accent)]" />
          Typo tolerant
        </label>
        <span className="text-anywhere text-sm font-semibold text-[var(--muted-foreground)]">Searching within current manifest only: {sourceLabel}</span>
      </div>

      <div className="metric-grid text-sm text-[var(--muted-foreground)]">
        <span className="metric-tile">{sourceCount} collected videos indexed</span>
        <span className="metric-tile">{matchedCount} search matches</span>
        <span className="metric-tile">{filteredCount} after filters</span>
      </div>
    </Card>
  );
}

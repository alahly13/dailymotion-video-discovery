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
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-black">
            <Search className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
            Search Current Results
          </h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--muted-foreground)]">
            Search looks inside videos already collected. Filters refine the searched results. Neither action calls Dailymotion.
          </p>
        </div>
        <div className="rounded-md border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-xs font-bold uppercase text-[var(--muted-foreground)]">
          Search does not call Dailymotion
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1.5fr_0.8fr]">
        <label className="space-y-1 text-sm font-semibold">
          <span>Search collected results</span>
          <Input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Search title, description, owner, tags, Arabic, English, year, views, attempt..." />
        </label>
        <label className="space-y-1 text-sm font-semibold">
          <span>Search mode</span>
          <select value={scope} onChange={(event) => onScopeChange(event.target.value as ChannelExplorerSearchScope)} className="min-h-11 w-full rounded-md border border-[var(--border)] bg-[var(--background-elevated)] px-4 text-sm outline-none transition focus:ring-4 focus:ring-[var(--ring)]">
            <option value="current">Current live results</option>
            <option value="combined">Combined saved manifest</option>
            <option value="attempt">Selected attempt</option>
          </select>
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="inline-flex min-h-10 items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--background-elevated)] px-3 text-sm font-semibold text-[var(--muted-foreground)]">
          <input type="checkbox" checked={exactPhrase} onChange={(event) => onExactPhraseChange(event.target.checked)} className="h-4 w-4 accent-[var(--accent)]" />
          Exact phrase
        </label>
        <label className="inline-flex min-h-10 items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--background-elevated)] px-3 text-sm font-semibold text-[var(--muted-foreground)]">
          <input type="checkbox" checked={fuzzy} onChange={(event) => onFuzzyChange(event.target.checked)} className="h-4 w-4 accent-[var(--accent)]" />
          Typo tolerant
        </label>
        <span className="text-sm font-semibold text-[var(--muted-foreground)]">Searching within current manifest only: {sourceLabel}</span>
      </div>

      <div className="grid gap-3 text-sm text-[var(--muted-foreground)] sm:grid-cols-3">
        <span>{sourceCount} collected videos indexed</span>
        <span>{matchedCount} search matches</span>
        <span>{filteredCount} after filters</span>
      </div>
    </Card>
  );
}

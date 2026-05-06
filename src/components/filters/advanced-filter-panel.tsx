"use client";

import type { AdvancedVideoFilters, VideoSortOption } from "@/types/filters";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const sorts: VideoSortOption[] = ["local_relevance", "newest", "oldest", "highest_views", "least_views", "duration_asc", "duration_desc", "title_asc", "title_desc"];

function numberValue(value: string) { return value === "" ? null : Number(value); }
function booleanValue(value: string) { return value === "" ? null : value === "true"; }

export function AdvancedFilterPanel({ filters, onChange, onReset }: { filters: AdvancedVideoFilters; onChange: (filters: AdvancedVideoFilters) => void; onReset: () => void }) {
  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold">Result Filters</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--muted-foreground)]">
            Result filters only filter and sort videos already collected in the current manifest. They do not call the Dailymotion API.
          </p>
        </div>
        <Button variant="ghost" onClick={onReset}>Reset Filters</Button>
      </div>
      <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
        <Input placeholder="Keyword" value={filters.keyword ?? ""} onChange={(e) => onChange({ ...filters, keyword: e.target.value })} />
        <Input type="number" placeholder="Min views" value={filters.minViews ?? ""} onChange={(e) => onChange({ ...filters, minViews: numberValue(e.target.value) })} />
        <Input type="number" placeholder="Max views" value={filters.maxViews ?? ""} onChange={(e) => onChange({ ...filters, maxViews: numberValue(e.target.value) })} />
        <Input type="number" placeholder="Target views" value={filters.targetViews ?? ""} onChange={(e) => onChange({ ...filters, targetViews: numberValue(e.target.value) })} />
        <Input type="number" placeholder="Duration min sec" value={filters.durationMin ?? ""} onChange={(e) => onChange({ ...filters, durationMin: numberValue(e.target.value) })} />
        <Input type="number" placeholder="Duration max sec" value={filters.durationMax ?? ""} onChange={(e) => onChange({ ...filters, durationMax: numberValue(e.target.value) })} />
        <Input type="number" placeholder="Year" value={filters.year ?? ""} onChange={(e) => onChange({ ...filters, year: numberValue(e.target.value) })} />
        <Input type="number" placeholder="Year from" value={filters.yearFrom ?? ""} onChange={(e) => onChange({ ...filters, yearFrom: numberValue(e.target.value) })} />
        <Input type="number" placeholder="Year to" value={filters.yearTo ?? ""} onChange={(e) => onChange({ ...filters, yearTo: numberValue(e.target.value) })} />
        <Input type="date" placeholder="Date from" value={filters.dateFrom ?? ""} onChange={(e) => onChange({ ...filters, dateFrom: e.target.value || null })} />
        <Input type="date" placeholder="Date to" value={filters.dateTo ?? ""} onChange={(e) => onChange({ ...filters, dateTo: e.target.value || null })} />
        <Input placeholder="Language" value={filters.language ?? ""} onChange={(e) => onChange({ ...filters, language: e.target.value })} />
        <Input placeholder="Channel" value={filters.channel ?? ""} onChange={(e) => onChange({ ...filters, channel: e.target.value })} />
        <Input placeholder="Owner" value={filters.owner ?? ""} onChange={(e) => onChange({ ...filters, owner: e.target.value })} />
        <select
          className="min-h-11 rounded-md border border-[var(--border)] bg-[var(--background-elevated)] px-4 text-sm outline-none transition focus:ring-4 focus:ring-[var(--ring)]"
          value={filters.hasThumbnail === null || filters.hasThumbnail === undefined ? "" : String(filters.hasThumbnail)}
          onChange={(e) => onChange({ ...filters, hasThumbnail: booleanValue(e.target.value) })}
        >
          <option value="">Any thumbnail</option>
          <option value="true">Has thumbnail</option>
          <option value="false">No thumbnail</option>
        </select>
        <select
          className="min-h-11 rounded-md border border-[var(--border)] bg-[var(--background-elevated)] px-4 text-sm outline-none transition focus:ring-4 focus:ring-[var(--ring)]"
          value={filters.hasDescription === null || filters.hasDescription === undefined ? "" : String(filters.hasDescription)}
          onChange={(e) => onChange({ ...filters, hasDescription: booleanValue(e.target.value) })}
        >
          <option value="">Any description</option>
          <option value="true">Has description</option>
          <option value="false">No description</option>
        </select>
        <select
          className="min-h-11 rounded-md border border-[var(--border)] bg-[var(--background-elevated)] px-4 text-sm outline-none transition focus:ring-4 focus:ring-[var(--ring)]"
          value={filters.sort ?? "local_relevance"}
          onChange={(e) => onChange({ ...filters, sort: e.target.value as VideoSortOption })}
        >
          {sorts.map((sort) => (
            <option key={sort} value={sort}>{sort}</option>
          ))}
        </select>
        <label className="flex min-h-11 items-center gap-3 rounded-md border border-[var(--border)] bg-[var(--background-elevated)] px-4 text-sm font-semibold">
          <input type="checkbox" checked={filters.strictMetadataFiltering === true} onChange={(e) => onChange({ ...filters, strictMetadataFiltering: e.target.checked })} className="h-4 w-4 accent-[var(--accent)]" />
          Strict metadata
        </label>
      </div>
    </Card>
  );
}

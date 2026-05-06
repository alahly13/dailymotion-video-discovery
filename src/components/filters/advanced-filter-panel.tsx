"use client";

import type { AdvancedVideoFilters, VideoSortOption } from "@/types/filters";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const sorts: VideoSortOption[] = ["local_relevance", "newest", "oldest", "highest_views", "least_views", "duration_asc", "duration_desc", "title_asc", "title_desc"];

function numberValue(value: string) { return value === "" ? null : Number(value); }

export function AdvancedFilterPanel({ filters, onChange, onReset }: { filters: AdvancedVideoFilters; onChange: (filters: AdvancedVideoFilters) => void; onReset: () => void }) {
  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between gap-4"><h2 className="text-lg font-bold">Advanced Manifest Filters</h2><Button variant="ghost" onClick={onReset}>Reset Filters</Button></div>
      <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
        <Input placeholder="Keyword" value={filters.keyword ?? ""} onChange={(e) => onChange({ ...filters, keyword: e.target.value })} />
        <Input type="number" placeholder="Min views" value={filters.minViews ?? ""} onChange={(e) => onChange({ ...filters, minViews: numberValue(e.target.value) })} />
        <Input type="number" placeholder="Max views" value={filters.maxViews ?? ""} onChange={(e) => onChange({ ...filters, maxViews: numberValue(e.target.value) })} />
        <Input type="number" placeholder="Target views" value={filters.targetViews ?? ""} onChange={(e) => onChange({ ...filters, targetViews: numberValue(e.target.value) })} />
        <Input type="number" placeholder="Duration min sec" value={filters.durationMin ?? ""} onChange={(e) => onChange({ ...filters, durationMin: numberValue(e.target.value) })} />
        <Input type="number" placeholder="Duration max sec" value={filters.durationMax ?? ""} onChange={(e) => onChange({ ...filters, durationMax: numberValue(e.target.value) })} />
        <Input type="number" placeholder="Year" value={filters.year ?? ""} onChange={(e) => onChange({ ...filters, year: numberValue(e.target.value) })} />
        <Input placeholder="Language" value={filters.language ?? ""} onChange={(e) => onChange({ ...filters, language: e.target.value })} />
        <select className="min-h-11 rounded-2xl border border-slate-300 bg-white/80 px-4 text-sm dark:border-slate-700 dark:bg-slate-950/70" value={filters.sort ?? "local_relevance"} onChange={(e) => onChange({ ...filters, sort: e.target.value as VideoSortOption })}>{sorts.map((sort) => <option key={sort} value={sort}>{sort}</option>)}</select>
      </div>
    </Card>
  );
}

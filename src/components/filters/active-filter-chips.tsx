import type { AdvancedVideoFilters } from "@/types/filters";

export function ActiveFilterChips({ filters }: { filters: AdvancedVideoFilters }) {
  const entries = Object.entries(filters).filter(([, value]) => value !== null && value !== undefined && value !== "" && value !== false);
  if (entries.length === 0) return null;
  return <div className="flex flex-wrap gap-2">{entries.map(([key, value]) => <span key={key} className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800 dark:bg-blue-950 dark:text-blue-200">{key}: {String(value)}</span>)}</div>;
}

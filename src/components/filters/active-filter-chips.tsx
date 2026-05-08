import type { AdvancedVideoFilters } from "@/types/filters";
import { defaultAdvancedVideoFilters } from "@/lib/filters/filter-types";

export function ActiveFilterChips({ filters }: { filters: AdvancedVideoFilters }) {
  const entries = Object.entries(filters).filter(([key, value]) => {
    const defaultValue = defaultAdvancedVideoFilters[key as keyof typeof defaultAdvancedVideoFilters];
    if (value === null || value === undefined || value === "") return false;
    return value !== defaultValue;
  });
  if (entries.length === 0) return null;
  return (
    <div className="chip-row rounded-lg border border-[var(--border)] bg-[var(--surface-container-low)] p-3">
      {entries.map(([key, value]) => (
        <span key={key} className="metadata-chip rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs font-black text-[var(--foreground)]">
          {key}: {String(value)}
        </span>
      ))}
    </div>
  );
}

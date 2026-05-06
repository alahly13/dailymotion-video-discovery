import type { AdvancedVideoFilters } from "@/types/filters";

export function ActiveFilterChips({ filters }: { filters: AdvancedVideoFilters }) {
  const entries = Object.entries(filters).filter(([, value]) => value !== null && value !== undefined && value !== "" && value !== false);
  if (entries.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {entries.map(([key, value]) => (
        <span key={key} className="rounded-md border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-1 text-xs font-semibold text-[var(--foreground)]">
          {key}: {String(value)}
        </span>
      ))}
    </div>
  );
}

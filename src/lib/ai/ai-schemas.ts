import type { AdvancedVideoFilters } from "@/types/filters";

export interface AiFilterHelperResponse {
  filters: AdvancedVideoFilters;
  explanation: string;
  warnings: string[];
}

export function validateAiFilters(input: unknown): AdvancedVideoFilters {
  if (!input || typeof input !== "object") return {};
  const candidate = input as Record<string, unknown>;
  const filters: AdvancedVideoFilters = {};
  if (typeof candidate.keyword === "string") filters.keyword = candidate.keyword;
  for (const key of ["minViews", "maxViews", "targetViews", "durationMin", "durationMax", "year", "yearFrom", "yearTo"] as const) {
    const value = candidate[key];
    if (typeof value === "number" && Number.isFinite(value)) filters[key] = value;
  }
  if (typeof candidate.language === "string") filters.language = candidate.language;
  if (typeof candidate.channel === "string") filters.channel = candidate.channel;
  if (typeof candidate.owner === "string") filters.owner = candidate.owner;
  if (typeof candidate.hasThumbnail === "boolean") filters.hasThumbnail = candidate.hasThumbnail;
  if (typeof candidate.hasDescription === "boolean") filters.hasDescription = candidate.hasDescription;
  return filters;
}

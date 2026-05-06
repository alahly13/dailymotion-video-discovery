import type { AdvancedVideoFilters } from "@/types/filters";
import type { NormalizedVideoMetadata } from "@/types/video";
import { isPresentNumber } from "@/lib/utils/zero-safe-number";

function includesText(value: string | null | undefined, needle: string) {
  return (value ?? "").toLowerCase().includes(needle);
}

function hasMetadata(value: unknown) {
  return value !== null && value !== undefined && value !== "";
}

function passesNumber(value: number | null, minimum?: number | null, maximum?: number | null, strict = false) {
  if ((minimum === null || minimum === undefined) && (maximum === null || maximum === undefined)) return true;
  if (!isPresentNumber(value)) return !strict;
  if (minimum !== null && minimum !== undefined && value < minimum) return false;
  if (maximum !== null && maximum !== undefined && value > maximum) return false;
  return true;
}

export function applyAdvancedVideoFilters(items: readonly NormalizedVideoMetadata[], filters: AdvancedVideoFilters) {
  const keyword = filters.keyword?.trim().toLowerCase() ?? "";
  const language = filters.language?.trim().toLowerCase() ?? "";
  const channel = filters.channel?.trim().toLowerCase() ?? "";
  const owner = filters.owner?.trim().toLowerCase() ?? "";
  const strict = filters.strictMetadataFiltering === true;

  const filtered = items.filter((video) => {
    if (keyword) {
      const haystack = [video.title, video.description, video.channelName, video.ownerName, ...video.tags].join(" ").toLowerCase();
      if (!haystack.includes(keyword)) return false;
    }

    if (!passesNumber(video.views, filters.minViews, filters.maxViews, strict)) return false;
    if (filters.targetViews !== null && filters.targetViews !== undefined && isPresentNumber(video.views) && video.views !== filters.targetViews) return false;
    if (filters.targetViews !== null && filters.targetViews !== undefined && !isPresentNumber(video.views) && strict) return false;
    if (!passesNumber(video.duration, filters.durationMin, filters.durationMax, strict)) return false;
    if (!passesNumber(video.year, filters.yearFrom ?? filters.year, filters.yearTo ?? filters.year, strict)) return false;

    if (filters.dateFrom || filters.dateTo) {
      if (!video.createdAt) return !strict;
      const createdTime = new Date(video.createdAt).getTime();
      if (!Number.isFinite(createdTime)) return !strict;
      if (filters.dateFrom && createdTime < new Date(filters.dateFrom).getTime()) return false;
      if (filters.dateTo && createdTime > new Date(filters.dateTo).getTime()) return false;
    }

    if (language && !includesText(video.language, language)) return false;
    if (channel && !includesText(video.channelName ?? video.channelId, channel)) return false;
    if (owner && !includesText(video.ownerName ?? video.ownerId, owner)) return false;
    if (filters.hasThumbnail !== null && filters.hasThumbnail !== undefined && video.hasThumbnail !== filters.hasThumbnail) return false;
    if (filters.hasDescription !== null && filters.hasDescription !== undefined && video.hasDescription !== filters.hasDescription) return false;

    if (strict && (filters.minViews !== null && filters.minViews !== undefined) && !hasMetadata(video.views)) return false;
    return true;
  });

  const sorted = [...filtered];
  switch (filters.sort ?? "local_relevance") {
    case "newest":
      sorted.sort((a, b) => Date.parse(b.createdAt ?? "0") - Date.parse(a.createdAt ?? "0"));
      break;
    case "oldest":
      sorted.sort((a, b) => Date.parse(a.createdAt ?? "0") - Date.parse(b.createdAt ?? "0"));
      break;
    case "highest_views":
      sorted.sort((a, b) => (b.views ?? -1) - (a.views ?? -1));
      break;
    case "least_views":
      sorted.sort((a, b) => (a.views ?? Number.MAX_SAFE_INTEGER) - (b.views ?? Number.MAX_SAFE_INTEGER));
      break;
    case "duration_asc":
      sorted.sort((a, b) => (a.duration ?? Number.MAX_SAFE_INTEGER) - (b.duration ?? Number.MAX_SAFE_INTEGER));
      break;
    case "duration_desc":
      sorted.sort((a, b) => (b.duration ?? -1) - (a.duration ?? -1));
      break;
    case "title_asc":
      sorted.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case "title_desc":
      sorted.sort((a, b) => b.title.localeCompare(a.title));
      break;
  }

  return sorted;
}

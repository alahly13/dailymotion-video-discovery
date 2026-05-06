import type { NormalizedVideoMetadata } from "@/types/video";
import { zeroSafeNumber } from "@/lib/utils/zero-safe-number";

export interface DailymotionRawVideo {
  id?: string;
  title?: string;
  description?: string | null;
  thumbnail_720_url?: string | null;
  thumbnail_480_url?: string | null;
  thumbnail_360_url?: string | null;
  thumbnail_url?: string | null;
  duration?: number | string | null;
  views_total?: number | string | null;
  ratings_total?: number | string | null;
  language?: string | null;
  created_time?: number | string | null;
  created_time_iso?: string | null;
  channel?: string | null;
  "channel.name"?: string | null;
  owner?: string | null;
  "owner.screenname"?: string | null;
  tags?: string[] | string | null;
  url?: string | null;
}

function createdAtFromRaw(raw: DailymotionRawVideo) {
  if (raw.created_time_iso) return raw.created_time_iso;
  const timestamp = zeroSafeNumber(raw.created_time);
  return timestamp !== null ? new Date(timestamp * 1000).toISOString() : null;
}

function parseTags(tags: DailymotionRawVideo["tags"]) {
  if (Array.isArray(tags)) return tags.filter((tag): tag is string => typeof tag === "string" && tag.length > 0);
  if (typeof tags === "string" && tags.trim()) return tags.split(",").map((tag) => tag.trim()).filter(Boolean);
  return [];
}

export function normalizeDailymotionVideo(raw: DailymotionRawVideo): NormalizedVideoMetadata | null {
  if (!raw.id) return null;
  const createdAt = createdAtFromRaw(raw);
  const thumbnail = raw.thumbnail_720_url ?? raw.thumbnail_480_url ?? raw.thumbnail_360_url ?? raw.thumbnail_url ?? null;
  const description = raw.description ?? null;

  return {
    id: raw.id,
    platform: "dailymotion",
    url: raw.url ?? `https://www.dailymotion.com/video/${raw.id}`,
    embedUrl: `https://www.dailymotion.com/embed/video/${raw.id}?mute=1`,
    title: raw.title ?? "Untitled Dailymotion video",
    description,
    thumbnail,
    duration: zeroSafeNumber(raw.duration),
    views: zeroSafeNumber(raw.views_total),
    rating: zeroSafeNumber(raw.ratings_total),
    language: raw.language ?? null,
    createdAt,
    year: createdAt ? new Date(createdAt).getUTCFullYear() : null,
    channelId: raw.channel ?? null,
    channelName: raw["channel.name"] ?? raw.channel ?? null,
    ownerId: raw.owner ?? null,
    ownerName: raw["owner.screenname"] ?? raw.owner ?? null,
    tags: parseTags(raw.tags),
    hasThumbnail: thumbnail !== null && thumbnail !== "",
    hasDescription: description !== null && description.trim().length > 0,
    raw,
  };
}

export function normalizeDailymotionVideos(rawItems: DailymotionRawVideo[]) {
  const seen = new Set<string>();
  const normalized: NormalizedVideoMetadata[] = [];
  for (const item of rawItems) {
    const video = normalizeDailymotionVideo(item);
    if (!video || seen.has(video.id)) continue;
    seen.add(video.id);
    normalized.push(video);
  }
  return normalized;
}

import type { TemporarySearchManifest } from "@/types/manifest";
import type { NormalizedVideoMetadata } from "@/types/video";
import { dedupeVideos } from "./channel-manifest";

export function createTemporarySearchManifest(query: string, items: NormalizedVideoMetadata[]): TemporarySearchManifest {
  const now = new Date().toISOString();
  return {
    id: `dm-search-${crypto.randomUUID()}`,
    platform: "dailymotion",
    query,
    items: dedupeVideos(items),
    createdAt: now,
    updatedAt: now,
  };
}

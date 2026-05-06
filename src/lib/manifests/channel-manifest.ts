import type { ChannelManifest, ChannelSourceType } from "@/types/manifest";
import type { NormalizedVideoMetadata } from "@/types/video";

export function createChannelManifest(args: {
  sourceType: ChannelSourceType;
  sourceInput: string;
  resolvedChannelId: string | null;
  resolvedChannelName: string | null;
  requestId: string;
  items?: NormalizedVideoMetadata[];
  totalKnownItems?: number | null;
  pagesFetched?: number;
  isComplete?: boolean;
  isPartial?: boolean;
}): ChannelManifest {
  const now = new Date().toISOString();
  return {
    id: `dm-channel-${args.requestId}`,
    platform: "dailymotion",
    sourceType: args.sourceType,
    sourceInput: args.sourceInput,
    resolvedChannelId: args.resolvedChannelId,
    resolvedChannelName: args.resolvedChannelName,
    items: dedupeVideos(args.items ?? []),
    fetchStatus: args.isComplete ? "complete" : args.isPartial ? "partial" : "fetching",
    pagesFetched: args.pagesFetched ?? 0,
    totalKnownItems: args.totalKnownItems ?? null,
    isComplete: args.isComplete ?? false,
    isPartial: args.isPartial ?? false,
    createdAt: now,
    updatedAt: now,
    requestId: args.requestId,
  };
}

export function dedupeVideos(items: readonly NormalizedVideoMetadata[]) {
  const seen = new Set<string>();
  const output: NormalizedVideoMetadata[] = [];
  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    output.push(item);
  }
  return output;
}

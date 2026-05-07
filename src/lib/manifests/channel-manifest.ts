import type { ChannelManifest, ChannelSourceType } from "@/types/manifest";
import type { NormalizedVideoMetadata } from "@/types/video";
import type { ChannelFetchCompletenessStatus, ChannelFetchSettings, ChannelSourceMetadata } from "@/types/channel-fetch";

function normalizeIdentityText(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function stableDescriptionHash(value: string | null | undefined) {
  const normalized = normalizeIdentityText(value);
  if (!normalized) return "no-description";
  let hash = 0;
  for (let index = 0; index < normalized.length; index += 1) {
    hash = (hash * 31 + normalized.charCodeAt(index)) >>> 0;
  }
  return hash.toString(36);
}

function canonicalVideoUrl(value: string | null | undefined) {
  const normalized = normalizeIdentityText(value);
  if (!normalized) return null;
  try {
    const url = new URL(normalized);
    url.hash = "";
    url.search = "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return normalized.replace(/\/$/, "");
  }
}

export function platformVideoIdentityKey(platform: string, platformVideoId: string | null | undefined) {
  const id = normalizeIdentityText(platformVideoId);
  return id ? `${normalizeIdentityText(platform)}:${id}` : null;
}

export function getVideoDedupeKey(item: NormalizedVideoMetadata) {
  const platformKey = platformVideoIdentityKey(item.platform, item.id);
  if (platformKey) return `platform-id:${platformKey}`;

  const canonicalUrl = canonicalVideoUrl(item.url);
  if (canonicalUrl) return `url:${item.platform}:${canonicalUrl}`;

  const title = normalizeIdentityText(item.title);
  const owner = normalizeIdentityText(item.ownerId ?? item.channelId ?? item.collectionProvenance?.sourceExternalId ?? null);
  const published = normalizeIdentityText(item.createdAt?.slice(0, 10));
  const thumbnail = canonicalVideoUrl(item.thumbnail);

  // This fallback is intentionally multi-field and conservative. It only runs
  // when a provider video ID is absent, and it combines normalized title,
  // duration, publish date, owner/source, thumbnail, and description hash so
  // similar titles alone cannot collapse distinct videos.
  return [
    "fingerprint",
    normalizeIdentityText(item.platform),
    owner || "unknown-owner",
    title || "untitled",
    item.duration ?? "unknown-duration",
    published || "unknown-date",
    thumbnail ?? "no-thumbnail",
    stableDescriptionHash(item.description),
  ].join(":");
}

export function createChannelManifest(args: {
  sourceType: ChannelSourceType;
  sourceInput: string;
  resolvedChannelId: string | null;
  resolvedChannelName: string | null;
  requestId: string;
  items?: NormalizedVideoMetadata[];
  totalKnownItems?: number | null;
  pagesFetched?: number;
  totalWindowsProcessed?: number;
  cappedWindowCount?: number;
  failedWindowCount?: number;
  duplicateCount?: number;
  completenessStatus?: ChannelFetchCompletenessStatus;
  fetchSettings?: ChannelFetchSettings | null;
  sourceMetadata?: ChannelSourceMetadata | null;
  fetchJobId?: string | null;
  manifestScope?: "combined" | "attempt" | "runtime";
  attemptNumber?: number | null;
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
    totalWindowsProcessed: args.totalWindowsProcessed ?? 0,
    cappedWindowCount: args.cappedWindowCount ?? 0,
    failedWindowCount: args.failedWindowCount ?? 0,
    duplicateCount: args.duplicateCount ?? 0,
    completenessStatus: args.completenessStatus ?? (args.isComplete ? "complete" : args.isPartial ? "partial" : "unknown"),
    fetchSettings: args.fetchSettings ?? null,
    sourceMetadata: args.sourceMetadata ?? null,
    fetchJobId: args.fetchJobId ?? null,
    manifestScope: args.manifestScope ?? "runtime",
    attemptNumber: args.attemptNumber ?? null,
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
    const key = getVideoDedupeKey(item);
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(item);
  }
  return output;
}

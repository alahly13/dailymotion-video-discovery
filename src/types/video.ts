import type { PlatformId } from "./platform";

export type ManifestResultViewMode = "combined" | "by-attempt" | "current-attempt";

export type CollectionDuplicateStatus =
  | "new_in_attempt"
  | "already_collected"
  | "first_seen_earlier"
  | "unknown";

export interface VideoCollectionProvenance {
  sourceId: string | null;
  sourceName: string | null;
  sourceHandle: string | null;
  sourceExternalId: string | null;
  manifestId: string | null;
  manifestLabel: string | null;
  manifestScope: "combined" | "attempt" | "runtime";
  fetchJobId: string | null;
  attemptNumber: number | null;
  fetchProfile: string | null;
  fetchStatus: string | null;
  fetchWindowId: string | null;
  pageAttemptId: string | null;
  pageNumber: number | null;
  windowStart: string | null;
  windowEnd: string | null;
  collectedAt: string | null;
  firstSeenInManifestAt: string | null;
  duplicateStatus: CollectionDuplicateStatus;
  resultViewMode?: ManifestResultViewMode;
}

export interface NormalizedVideoMetadata {
  id: string;
  platform: PlatformId;
  url: string | null;
  embedUrl: string | null;
  title: string;
  description: string | null;
  thumbnail: string | null;
  duration: number | null;
  views: number | null;
  rating: number | null;
  language: string | null;
  createdAt: string | null;
  year: number | null;
  channelId: string | null;
  channelName: string | null;
  ownerId: string | null;
  ownerName: string | null;
  tags: string[];
  hasThumbnail: boolean;
  hasDescription: boolean;
  collectionProvenance?: VideoCollectionProvenance;
  raw?: unknown;
}

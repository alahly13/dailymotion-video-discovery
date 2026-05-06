import type { ChannelManifest } from "./manifest";
import type { NormalizedVideoMetadata } from "./video";

export type ChannelPersistenceMode = "runtime-memory" | "database";
export type ChannelPersistenceType = "temporary" | "durable";

export type FetchProfile =
  | "quick-preview"
  | "standard-fetch"
  | "deep-balanced"
  | "deep-aggressive"
  | "recent-sync"
  | "historical-backfill"
  | "custom-expert";

export type TimeWindowUnit = "all" | "year" | "month" | "week" | "day";

export type ChannelFetchCompletenessStatus =
  | "unknown"
  | "complete"
  | "partial"
  | "capped"
  | "stopped"
  | "failed"
  | "max_items_reached"
  | "timeout_limited"
  | "provider_limited"
  | "auth_or_provider_limited"
  | "expired";

export type CoverageConfidence = "high" | "medium" | "low" | "unknown";

export type FetchJobStatus =
  | "pending"
  | "running"
  | "partial"
  | "complete"
  | "capped"
  | "stopped"
  | "failed"
  | "max_items_reached"
  | "timeout_limited"
  | "provider_limited"
  | "auth_or_provider_limited"
  | "expired";

export type FetchWindowStatus = "pending" | "running" | "complete" | "capped" | "split" | "failed" | "stopped" | "skipped";

export interface ChannelFetchSettings {
  fetchProfile: FetchProfile;
  maxItems: number;
  maxTotalPages: number;
  maxWindows: number;
  pageSize: number;
  fromDate: string | null;
  toDate: string | null;
  initialWindowUnit: TimeWindowUnit;
  minimumSplitUnit: Exclude<TimeWindowUnit, "all">;
  autoSplitCappedWindows: boolean;
  delayMs: number;
  stopWhenMaxItemsReached: boolean;
  stopOnCappedWindow: boolean;
  preservePartialManifest: boolean;
  resumeJobId?: string | null;
}

export interface FetchSafetyCaps {
  legacyMaxPages: number;
  maxItems: number;
  maxTotalPages: number;
  maxWindows: number;
  maxWindowDepth: number;
  maxPageSize: number;
  defaultDelayMs: number;
  minDelayMs: number;
  defaultProfile: FetchProfile;
  jobTtlHours: number;
  tempManifestTtlHours: number;
  manifestPersistenceEnabled: boolean;
}

export interface ChannelSourceMetadata {
  platform: "dailymotion";
  sourceType: string;
  sourceInput: string;
  externalSourceId: string;
  handle: string | null;
  username: string | null;
  displayName: string | null;
  canonicalUrl: string | null;
  thumbnailUrl: string | null;
  avatarUrl: string | null;
  description: string | null;
  country: string | null;
  language: string | null;
  reportedTotalFromApi: number | null;
  reportedTotalFieldName: string | null;
  reportedTotalCheckedAt: string | null;
  metadataJson: unknown | null;
  metadataUnavailableReason?: string | null;
  persistedSourceId?: string | null;
  persistence?: ChannelPersistenceMode;
  persistenceWarning?: string | null;
}

export interface ChannelCoverage {
  reportedTotalFromApi: number | null;
  reportedTotalCheckedAt: string | null;
  collectedUniqueVideos: number;
  estimatedRemainingVideos: number | null;
  coveragePercent: number | null;
  coverageStatus: ChannelFetchCompletenessStatus;
  coverageConfidence: CoverageConfidence;
  cappedWindowCount: number;
  failedWindowCount: number;
  completedWindowCount: number;
  pendingWindowCount: number;
  latestSuccessfulCheckpoint: string | null;
  lastResumePoint: string | null;
  warning: string | null;
  persistence?: ChannelPersistenceMode;
  persistenceWarning?: string | null;
  persistenceType?: ChannelPersistenceType;
}

export interface FetchWindowSummary {
  id: string;
  parentWindowId: string | null;
  status: FetchWindowStatus;
  windowStart: string | null;
  windowEnd: string | null;
  unit: TimeWindowUnit;
  depth: number;
  nextPageToFetch: number;
  pagesFetched: number;
  itemsFound: number;
  uniqueItemsAdded: number;
  duplicateItemsFound: number;
  reachedProviderCap: boolean;
  hasMoreAtEnd: boolean | null;
  errorMessage: string | null;
  startedAt: string | null;
  completedAt: string | null;
}

export interface FetchPageAttemptSummary {
  id: string;
  fetchWindowId: string;
  pageNumber: number;
  limit: number;
  status: "success" | "failed" | "rate_limited" | "auth_or_provider_limited" | "canceled";
  itemsReturned: number;
  uniqueItemsAdded: number;
  duplicateItemsFound: number;
  hasMore: boolean;
  requestedAt: string;
  completedAt: string | null;
}

export interface FetchProgressSummary {
  fetchProfile: FetchProfile;
  status: FetchJobStatus;
  completenessStatus: ChannelFetchCompletenessStatus;
  pagesFetched: number;
  windowsProcessed: number;
  windowsQueued: number;
  itemsCollected: number;
  uniqueItemsCollected: number;
  duplicateCount: number;
  cappedWindowCount: number;
  failedWindowCount: number;
  currentWindow: FetchWindowSummary | null;
  maxItemsReached: boolean;
  partialManifestPreserved: boolean;
  resumable: boolean;
}

export interface FetchHistoryEntry {
  id: string;
  sourceKey: string;
  fetchProfile: FetchProfile;
  status: FetchJobStatus;
  completenessStatus: ChannelFetchCompletenessStatus;
  startedAt: string | null;
  completedAt: string | null;
  stoppedAt: string | null;
  updatedAt: string;
  uniqueItemsCollected: number;
  pagesFetched: number;
  windowsProcessed: number;
  cappedWindowCount: number;
  failedWindowCount: number;
  resumable: boolean;
  currentResumeCheckpoint?: string | null;
  persistence: ChannelPersistenceMode;
  persistenceType?: ChannelPersistenceType;
  persistenceWarning?: string | null;
}

export interface ChannelFetchJobSnapshot {
  id: string;
  sourceKey: string;
  status: FetchJobStatus;
  completenessStatus: ChannelFetchCompletenessStatus;
  settings: ChannelFetchSettings;
  metadata: ChannelSourceMetadata | null;
  progress: FetchProgressSummary;
  coverage: ChannelCoverage;
  manifest: ChannelManifest;
  historyEntry: FetchHistoryEntry;
  windows: FetchWindowSummary[];
  recentPageAttempts: FetchPageAttemptSummary[];
  persistence: ChannelPersistenceMode;
  persistenceType?: ChannelPersistenceType;
  persistenceWarning?: string | null;
}

export interface ChannelFetchStartResponse {
  ok: boolean;
  job?: ChannelFetchJobSnapshot;
  metadata?: ChannelSourceMetadata | null;
  safetyCaps?: FetchSafetyCaps;
  persistence?: ChannelPersistenceMode;
  persistenceWarning?: string | null;
  error?: string;
  reason?: string | null;
}

export interface ChannelFetchNextResponse {
  ok: boolean;
  job?: ChannelFetchJobSnapshot;
  done?: boolean;
  persistence?: ChannelPersistenceMode;
  persistenceWarning?: string | null;
  error?: string;
  reason?: string | null;
}

export interface ChannelMetadataResponse {
  ok: boolean;
  metadata?: ChannelSourceMetadata;
  safetyCaps?: FetchSafetyCaps;
  persistence?: ChannelPersistenceMode;
  persistenceWarning?: string | null;
  error?: string;
  reason?: string | null;
}

export interface ChannelHistoryResponse {
  ok: boolean;
  history: FetchHistoryEntry[];
  persistence: ChannelPersistenceMode;
  persistenceWarning?: string | null;
  error?: string;
}

export interface ChannelCoverageResponse {
  ok: boolean;
  coverage: ChannelCoverage | null;
  persistence: ChannelPersistenceMode;
  persistenceWarning?: string | null;
  error?: string;
}

export type DedupeMergeResult = {
  merged: NormalizedVideoMetadata[];
  uniqueAdded: number;
  duplicates: number;
};

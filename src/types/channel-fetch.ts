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
  concurrency: number;
  delayMs: number;
  stopWhenMaxItemsReached: boolean;
  stopOnCappedWindow: boolean;
  preservePartialManifest: boolean;
  resumeJobId?: string | null;
  continueFromLatest?: boolean | null;
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
  defaultConcurrency: number;
  maxConcurrency: number;
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
  executionOrder: number | null;
}

export interface FetchPageAttemptSummary {
  id: string;
  fetchWindowId: string;
  pageNumber: number;
  limit: number;
  requestParams?: Record<string, string | number | boolean | null> | null;
  status: "success" | "failed" | "rate_limited" | "auth_or_provider_limited" | "canceled";
  itemsReturned: number;
  uniqueItemsAdded: number;
  duplicateItemsFound: number;
  hasMore: boolean;
  requestedAt: string;
  completedAt: string | null;
}

export interface FetchProgressSummary {
  attemptNumber: number;
  fetchProfile: FetchProfile;
  status: FetchJobStatus;
  completenessStatus: ChannelFetchCompletenessStatus;
  pageSize: number;
  pagesFetched: number;
  totalApiRequests: number;
  currentPageNumber: number | null;
  currentDateWindow: string | null;
  windowsProcessed: number;
  windowsQueued: number;
  activeWindowCount: number;
  queuedWindowCount: number;
  windowsCompleted: number;
  activeWindows: FetchWindowSummary[];
  currentConcurrentWorkers: number;
  maxConcurrentWorkers: number;
  parallelismEnabled: boolean;
  parallelismReason: string | null;
  itemsCollected: number;
  uniqueItemsCollected: number;
  duplicateCount: number;
  cappedWindowCount: number;
  failedWindowCount: number;
  currentWindow: FetchWindowSummary | null;
  lastCheckpoint: string | null;
  maxItemsReached: boolean;
  partialManifestPreserved: boolean;
  resumable: boolean;
}

export interface FetchHistoryEntry {
  id: string;
  sourceKey: string;
  attemptNumber: number;
  fetchProfile: FetchProfile;
  status: FetchJobStatus;
  completenessStatus: ChannelFetchCompletenessStatus;
  startedAt: string | null;
  completedAt: string | null;
  stoppedAt: string | null;
  updatedAt: string;
  manifestId?: string | null;
  itemsCollected: number;
  uniqueItemsCollected: number;
  duplicateCount: number;
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
  attemptNumber: number;
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

export interface ChannelManifestResponse {
  ok: boolean;
  manifest: ChannelManifest | null;
  history: FetchHistoryEntry[];
  coverage: ChannelCoverage | null;
  persistence: ChannelPersistenceMode;
  persistenceWarning?: string | null;
  error?: string;
}

export type SavedChannelResultScope = "combined" | "attempt";
export type SavedChannelSearchMode = "server" | "loaded-index";
export type SavedChannelSort =
  | "first_collected"
  | "newest"
  | "oldest"
  | "views_desc"
  | "duration_desc"
  | "title_asc";

export interface ChannelSourceSummary {
  id: string;
  sourceKey: string;
  sourceType: string;
  sourceInput: string;
  externalSourceId: string;
  handle: string | null;
  username: string | null;
  displayName: string | null;
  canonicalUrl: string | null;
  thumbnailUrl: string | null;
  avatarUrl: string | null;
  reportedTotalFromApi: number | null;
  reportedTotalCheckedAt: string | null;
  collectedUniqueVideos: number;
  estimatedRemainingVideos: number | null;
  coveragePercent: number | null;
  coverageStatus: ChannelFetchCompletenessStatus;
  coverageConfidence: CoverageConfidence;
  totalAttempts: number;
  lastFetchTime: string | null;
  latestAttemptId: string | null;
  latestAttemptNumber: number | null;
  latestAttemptStatus: FetchJobStatus | null;
  latestResumableAttemptId: string | null;
  combinedManifestId: string | null;
  persistence: ChannelPersistenceMode;
  persistenceWarning?: string | null;
}

export interface SavedChannelManifestResponse {
  ok: boolean;
  source: ChannelSourceSummary | null;
  manifest: ChannelManifest | null;
  history: FetchHistoryEntry[];
  coverage: ChannelCoverage | null;
  items: NormalizedVideoMetadata[];
  total: number;
  limit: number;
  offset: number;
  sort: SavedChannelSort;
  query: string;
  persistence: ChannelPersistenceMode;
  persistenceWarning?: string | null;
  error?: string;
}

export interface ChannelAttemptDetail {
  source: ChannelSourceSummary;
  job: ChannelFetchJobSnapshot;
  windows: FetchWindowSummary[];
  pageAttempts: FetchPageAttemptSummary[];
  items: NormalizedVideoMetadata[];
}

export interface ChannelAttemptDetailResponse {
  ok: boolean;
  attempt: ChannelAttemptDetail | null;
  persistence: ChannelPersistenceMode;
  persistenceWarning?: string | null;
  error?: string;
}

export interface SavedChannelSearchResponse {
  ok: boolean;
  source: ChannelSourceSummary | null;
  items: NormalizedVideoMetadata[];
  total: number;
  limit: number;
  offset: number;
  query: string;
  scope: SavedChannelResultScope;
  attemptId?: string | null;
  sort: SavedChannelSort;
  exactPhrase: boolean;
  fuzzy: boolean;
  mode: SavedChannelSearchMode;
  persistence: ChannelPersistenceMode;
  persistenceWarning?: string | null;
  error?: string;
}

export type DedupeMergeResult = {
  merged: NormalizedVideoMetadata[];
  uniqueAdded: number;
  duplicates: number;
};

import type { NormalizedVideoMetadata } from "./video";
import type { ChannelFetchCompletenessStatus, ChannelFetchSettings, ChannelSourceMetadata } from "./channel-fetch";

export type ChannelSourceType = "channel" | "profile" | "username" | "channel_id";
export type ManifestFetchStatus =
  | "idle"
  | "analyzing"
  | "fetching"
  | "partial"
  | "complete"
  | "capped"
  | "stopped"
  | "failed"
  | "rate_limited"
  | "max_items_reached"
  | "timeout_limited"
  | "provider_limited"
  | "auth_or_provider_limited"
  | "error";

export interface ChannelManifest {
  id: string;
  platform: "dailymotion";
  sourceType: ChannelSourceType;
  sourceInput: string;
  resolvedChannelId: string | null;
  resolvedChannelName: string | null;
  items: NormalizedVideoMetadata[];
  fetchStatus: ManifestFetchStatus;
  pagesFetched: number;
  totalKnownItems: number | null;
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
  isComplete: boolean;
  isPartial: boolean;
  createdAt: string;
  updatedAt: string;
  requestId: string;
}

export interface TemporarySearchManifest {
  id: string;
  platform: "dailymotion";
  query: string;
  items: NormalizedVideoMetadata[];
  createdAt: string;
  updatedAt: string;
}

import type { NormalizedVideoMetadata } from "./video";

export type ChannelSourceType = "channel" | "profile" | "username" | "channel_id";
export type ManifestFetchStatus = "idle" | "analyzing" | "fetching" | "partial" | "complete" | "error";

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

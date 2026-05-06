import type { PlatformId } from "./platform";

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
  raw?: unknown;
}

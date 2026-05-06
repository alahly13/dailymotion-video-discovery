import { createChannelManifest } from "@/lib/manifests/channel-manifest";
import { analyzeDailymotionChannelInput } from "./dailymotion-url-analyzer";
import { fetchDailymotionChannelPage } from "./dailymotion-client";

export const CHANNEL_FETCH_LIMITS = {
  pageSize: 50,
  maxPages: 200,
  maxVideos: 10_000,
  delayMs: 250,
};

export async function fetchDailymotionChannelFirstPage(input: string, requestId: string, signal?: AbortSignal) {
  const analysis = analyzeDailymotionChannelInput(input);
  const page = await fetchDailymotionChannelPage(analysis.apiPath, 1, CHANNEL_FETCH_LIMITS.pageSize, signal);
  return createChannelManifest({
    sourceType: analysis.sourceType,
    sourceInput: analysis.sourceInput,
    resolvedChannelId: analysis.resolvedIdentifier,
    resolvedChannelName: analysis.displayLabel,
    requestId,
    items: page.items,
    totalKnownItems: page.total,
    pagesFetched: 1,
    isComplete: !page.hasMore,
    isPartial: page.hasMore,
  });
}

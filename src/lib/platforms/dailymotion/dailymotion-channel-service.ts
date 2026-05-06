import { createChannelManifest } from "@/lib/manifests/channel-manifest";
import { getFetchSafetyConfig } from "@/lib/config/env";
import { analyzeDailymotionChannelInput } from "./dailymotion-url-analyzer";
import { fetchDailymotionChannelPage } from "./dailymotion-client";

const fetchSafety = getFetchSafetyConfig();

export const CHANNEL_FETCH_LIMITS = {
  pageSize: 50,
  maxPages: fetchSafety.maxPages,
  maxVideos: fetchSafety.maxItems,
  delayMs: fetchSafety.delayMs,
};

export async function fetchDailymotionChannelFirstPage(input: string, requestId: string, signal?: AbortSignal) {
  const analysis = analyzeDailymotionChannelInput(input);
  const page = await fetchDailymotionChannelPage(analysis.apiPath, 1, CHANNEL_FETCH_LIMITS.pageSize, signal);
  if (!page.ok || !page.data) {
    return { ok: false as const, error: page.error ?? "Unable to fetch channel.", reason: page.reason, status: page.status };
  }
  return {
    ok: true as const,
    manifest: createChannelManifest({
      sourceType: analysis.sourceType,
      sourceInput: analysis.sourceInput,
      resolvedChannelId: analysis.resolvedIdentifier,
      resolvedChannelName: analysis.displayLabel,
      requestId,
      items: page.data.items,
      totalKnownItems: page.data.total,
      pagesFetched: 1,
      isComplete: !page.data.hasMore,
      isPartial: page.data.hasMore,
    }),
  };
}

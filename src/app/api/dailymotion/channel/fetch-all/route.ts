import { NextResponse } from "next/server";
import { createChannelManifest, dedupeVideos } from "@/lib/manifests/channel-manifest";
import { analyzeDailymotionChannelInput } from "@/lib/platforms/dailymotion/dailymotion-url-analyzer";
import { fetchDailymotionChannelPage } from "@/lib/platforms/dailymotion/dailymotion-client";
import { CHANNEL_FETCH_LIMITS } from "@/lib/platforms/dailymotion/dailymotion-channel-service";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(request: Request) {
  try {
    const { input, requestId } = (await request.json()) as { input?: string; requestId?: string };
    const analysis = analyzeDailymotionChannelInput(input ?? "");
    let pageNumber = 1;
    let hasMore = true;
    let totalKnownItems: number | null = null;
    let items = [] as Awaited<ReturnType<typeof fetchDailymotionChannelPage>> extends infer T ? T extends { data: infer D } ? D extends { items: infer I } ? I : never : never : never;
    let failure: { error: string; reason: string | null; status?: number } | null = null;

    while (hasMore && pageNumber <= CHANNEL_FETCH_LIMITS.maxPages && items.length < CHANNEL_FETCH_LIMITS.maxVideos) {
      const page = await fetchDailymotionChannelPage(analysis.apiPath, pageNumber, CHANNEL_FETCH_LIMITS.pageSize, request.signal);
      if (!page.ok || !page.data) { failure = { error: page.error ?? "Fetch failed.", reason: page.reason, status: page.status }; break; }
      totalKnownItems = page.data.total;
      items = dedupeVideos([...items, ...page.data.items]);
      hasMore = page.data.hasMore && page.data.items.length > 0;
      pageNumber += 1;
      if (hasMore) await delay(CHANNEL_FETCH_LIMITS.delayMs);
    }

    const reachedSafetyLimit = hasMore && !failure;
    const isPartial = reachedSafetyLimit || Boolean(failure);
    const manifest = createChannelManifest({ sourceType: analysis.sourceType, sourceInput: analysis.sourceInput, resolvedChannelId: analysis.resolvedIdentifier, resolvedChannelName: analysis.displayLabel, requestId: requestId ?? crypto.randomUUID(), items, totalKnownItems, pagesFetched: pageNumber - (failure ? 1 : 0), isComplete: !isPartial, isPartial });
    if (failure) {
      const status = failure.status ?? (failure.reason === "rate_limited" ? 429 : 502);
      return NextResponse.json({ ok: false, manifest: { ...manifest, fetchStatus: failure.reason === "rate_limited" ? "rate_limited" : "partial" }, error: failure.error, reason: failure.reason, retryFromPage: pageNumber, safetyLimits: CHANNEL_FETCH_LIMITS }, { status });
    }
    return NextResponse.json({ ok: true, manifest, safetyLimits: CHANNEL_FETCH_LIMITS });
  } catch {
    return NextResponse.json({ ok: false, error: "Unable to fetch all channel videos.", reason: "unknown" }, { status: 400 });
  }
}

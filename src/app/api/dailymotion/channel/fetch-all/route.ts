import { NextResponse } from "next/server";
import { createChannelManifest, dedupeVideos } from "@/lib/manifests/channel-manifest";
import { analyzeDailymotionChannelInput } from "@/lib/platforms/dailymotion/dailymotion-url-analyzer";
import { fetchDailymotionChannelPage } from "@/lib/platforms/dailymotion/dailymotion-client";
import { CHANNEL_FETCH_LIMITS } from "@/lib/platforms/dailymotion/dailymotion-channel-service";

function delay(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => {
      clearTimeout(timeout);
      reject(new DOMException("Fetch stopped", "AbortError"));
    }, { once: true });
  });
}

export async function POST(request: Request) {
  try {
    const { input, requestId } = (await request.json()) as { input?: string; requestId?: string };
    const analysis = analyzeDailymotionChannelInput(input ?? "");
    let pageNumber = 1;
    let hasMore = true;
    let totalKnownItems: number | null = null;
    let items = [] as Awaited<ReturnType<typeof fetchDailymotionChannelPage>>["items"];

    while (hasMore && pageNumber <= CHANNEL_FETCH_LIMITS.maxPages && items.length < CHANNEL_FETCH_LIMITS.maxVideos) {
      const page = await fetchDailymotionChannelPage(analysis.apiPath, pageNumber, CHANNEL_FETCH_LIMITS.pageSize, request.signal);
      totalKnownItems = page.total;
      items = dedupeVideos([...items, ...page.items]);
      hasMore = page.hasMore && page.items.length > 0;
      if (hasMore) await delay(CHANNEL_FETCH_LIMITS.delayMs, request.signal);
      pageNumber += 1;
    }

    const reachedSafetyLimit = hasMore;
    const manifest = createChannelManifest({
      sourceType: analysis.sourceType,
      sourceInput: analysis.sourceInput,
      resolvedChannelId: analysis.resolvedIdentifier,
      resolvedChannelName: analysis.displayLabel,
      requestId: requestId ?? crypto.randomUUID(),
      items,
      totalKnownItems,
      pagesFetched: pageNumber - 1,
      isComplete: !reachedSafetyLimit,
      isPartial: reachedSafetyLimit,
    });
    return NextResponse.json({ manifest, safetyLimits: CHANNEL_FETCH_LIMITS });
  } catch (error) {
    const status = error instanceof DOMException && error.name === "AbortError" ? 499 : 400;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to fetch all channel videos." }, { status });
  }
}

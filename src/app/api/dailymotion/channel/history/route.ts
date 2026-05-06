import { NextResponse } from "next/server";
import { listChannelFetchHistory, runtimeFetchPersistence, sourceKeyFromInput } from "@/lib/platforms/dailymotion/channel-deep-fetch-service";
import type { ChannelHistoryResponse } from "@/types/channel-fetch";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const sourceKey = url.searchParams.get("sourceKey") ?? (url.searchParams.get("input") ? sourceKeyFromInput(url.searchParams.get("input") ?? "") : undefined);
    return NextResponse.json({ ok: true, history: listChannelFetchHistory(sourceKey), persistence: runtimeFetchPersistence } satisfies ChannelHistoryResponse);
  } catch (error) {
    return NextResponse.json({ ok: false, history: [], persistence: runtimeFetchPersistence, error: error instanceof Error ? error.message : "Unable to load fetch history." } satisfies ChannelHistoryResponse, { status: 400 });
  }
}

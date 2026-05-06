import { NextResponse } from "next/server";
import { getFetchSafetyConfig } from "@/lib/config/env";
import { fetchDailymotionSourceMetadata } from "@/lib/platforms/dailymotion/channel-metadata-service";
import { analyzeDailymotionChannelInput } from "@/lib/platforms/dailymotion/dailymotion-url-analyzer";
import type { ChannelMetadataResponse } from "@/types/channel-fetch";

export async function POST(request: Request) {
  try {
    const { input } = (await request.json()) as { input?: string };
    const analysis = analyzeDailymotionChannelInput(input ?? "");
    const result = await fetchDailymotionSourceMetadata(analysis, request.signal);
    const status = result.ok ? 200 : result.status ?? 502;
    return NextResponse.json(
      {
        ok: result.ok,
        metadata: result.metadata,
        safetyCaps: getFetchSafetyConfig(),
        error: result.ok ? undefined : result.error,
        reason: result.ok ? null : result.reason,
      } satisfies ChannelMetadataResponse,
      { status }
    );
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unable to fetch channel metadata.", reason: "user_input_error" }, { status: 400 });
  }
}

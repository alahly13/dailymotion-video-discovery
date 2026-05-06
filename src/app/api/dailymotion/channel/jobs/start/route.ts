import { NextResponse } from "next/server";
import { startChannelFetchJob } from "@/lib/platforms/dailymotion/channel-deep-fetch-service";
import type { ChannelFetchStartResponse } from "@/types/channel-fetch";

export async function POST(request: Request) {
  try {
    const { input, requestId, settings } = (await request.json()) as { input?: string; requestId?: string; settings?: unknown };
    const result = await startChannelFetchJob(input ?? "", settings ?? {}, requestId ?? crypto.randomUUID(), request.signal);
    return NextResponse.json({ ok: true, job: result.job, metadata: result.job.metadata, safetyCaps: result.caps } satisfies ChannelFetchStartResponse);
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unable to start fetch job.", reason: "user_input_error" } satisfies ChannelFetchStartResponse, { status: 400 });
  }
}

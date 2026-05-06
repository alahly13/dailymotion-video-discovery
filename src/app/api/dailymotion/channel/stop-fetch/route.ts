import { NextResponse } from "next/server";
import { stopChannelFetchJob } from "@/lib/platforms/dailymotion/channel-deep-fetch-service";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { jobId?: string };
    if (body.jobId) return NextResponse.json({ ok: true, job: stopChannelFetchJob(body.jobId) });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unable to stop fetch job." }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    message: "Client-side AbortController stops legacy in-flight fetches. Route-backed channel jobs use /api/dailymotion/channel/jobs/stop and preserve runtime resume checkpoints.",
  });
}

import { NextResponse } from "next/server";
import { stopChannelFetchJob } from "@/lib/platforms/dailymotion/channel-deep-fetch-service";
import type { ChannelFetchNextResponse } from "@/types/channel-fetch";

export async function POST(request: Request) {
  try {
    const { jobId } = (await request.json()) as { jobId?: string };
    if (!jobId) return NextResponse.json({ ok: false, error: "Missing fetch job ID.", reason: "user_input_error" } satisfies ChannelFetchNextResponse, { status: 400 });
    const job = await stopChannelFetchJob(jobId);
    return NextResponse.json({ ok: true, job, done: true, persistence: job.persistence, persistenceWarning: job.persistenceWarning } satisfies ChannelFetchNextResponse);
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unable to stop fetch job.", reason: "unknown" } satisfies ChannelFetchNextResponse, { status: 400 });
  }
}

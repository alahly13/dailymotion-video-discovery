import { NextResponse } from "next/server";
import { getChannelFetchJob } from "@/lib/platforms/dailymotion/channel-deep-fetch-service";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = getChannelFetchJob(id);
  if (!job) return NextResponse.json({ ok: false, error: "Fetch job was not found or has expired." }, { status: 404 });
  return NextResponse.json({ ok: true, job });
}

import { NextResponse } from "next/server";
import { fetchDailymotionChannelFirstPage } from "@/lib/platforms/dailymotion/dailymotion-channel-service";

export async function POST(request: Request) {
  try {
    const { input, requestId } = (await request.json()) as { input?: string; requestId?: string };
    const manifest = await fetchDailymotionChannelFirstPage(input ?? "", requestId ?? crypto.randomUUID(), request.signal);
    return NextResponse.json({ manifest });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to fetch channel." }, { status: 400 });
  }
}

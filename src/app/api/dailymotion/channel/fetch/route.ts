import { NextResponse } from "next/server";
import { fetchDailymotionChannelFirstPage } from "@/lib/platforms/dailymotion/dailymotion-channel-service";

export async function POST(request: Request) {
  try {
    const { input, requestId } = (await request.json()) as { input?: string; requestId?: string };
    const result = await fetchDailymotionChannelFirstPage(input ?? "", requestId ?? crypto.randomUUID(), request.signal);
    if (!result.ok) {
      const status = result.status ?? (result.reason === "rate_limited" ? 429 : 502);
      return NextResponse.json({ ok: false, error: result.error, reason: result.reason }, { status });
    }
    return NextResponse.json({ ok: true, manifest: result.manifest });
  } catch {
    return NextResponse.json({ ok: false, error: "Unable to fetch channel.", reason: "unknown" }, { status: 400 });
  }
}

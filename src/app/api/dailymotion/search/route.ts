import { NextResponse } from "next/server";
import { searchDailymotionVideos } from "@/lib/platforms/dailymotion/dailymotion-client";
import { createTemporarySearchManifest } from "@/lib/manifests/temporary-search-manifest";

export async function POST(request: Request) {
  try {
    const { query, page, limit } = (await request.json()) as { query?: string; page?: number; limit?: number };
    if (!query?.trim()) return NextResponse.json({ ok: false, error: "Enter a search query.", reason: "user_input_error" }, { status: 400 });
    const result = await searchDailymotionVideos(query, page ?? 1, limit ?? 50, request.signal);
    if (!result.ok || !result.data) return NextResponse.json({ ok: false, error: result.error, reason: result.reason }, { status: result.status ?? 502 });
    return NextResponse.json({ ok: true, manifest: createTemporarySearchManifest(query, result.data.items), page: result.data.page, total: result.data.total });
  } catch {
    return NextResponse.json({ ok: false, error: "Search failed.", reason: "unknown" }, { status: 400 });
  }
}

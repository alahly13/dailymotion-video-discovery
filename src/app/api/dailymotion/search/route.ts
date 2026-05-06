import { NextResponse } from "next/server";
import { getFetchSafetyConfig } from "@/lib/config/env";
import { searchDailymotionVideos } from "@/lib/platforms/dailymotion/dailymotion-client";
import { createTemporarySearchManifest } from "@/lib/manifests/temporary-search-manifest";

export async function POST(request: Request) {
  try {
    const { query, page, limit } = (await request.json()) as { query?: string; page?: number; limit?: number };
    if (!query?.trim()) return NextResponse.json({ ok: false, error: "Enter a search query.", reason: "user_input_error" }, { status: 400 });
    const caps = getFetchSafetyConfig();
    const safeLimit = Math.min(Math.max(Number(limit ?? 50), 1), caps.maxPageSize);
    const safePage = Math.max(Number(page ?? 1), 1);
    const result = await searchDailymotionVideos(query, safePage, safeLimit, request.signal);
    if (!result.ok || !result.data) return NextResponse.json({ ok: false, error: result.error, reason: result.reason }, { status: result.status ?? 502 });
    return NextResponse.json({ ok: true, manifest: createTemporarySearchManifest(query, result.data.items), page: result.data.page, total: result.data.total });
  } catch {
    return NextResponse.json({ ok: false, error: "Search failed.", reason: "unknown" }, { status: 400 });
  }
}

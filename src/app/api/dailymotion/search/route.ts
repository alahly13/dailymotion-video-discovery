import { NextResponse } from "next/server";
import { searchDailymotionVideos } from "@/lib/platforms/dailymotion/dailymotion-client";
import { createTemporarySearchManifest } from "@/lib/manifests/temporary-search-manifest";

export async function POST(request: Request) {
  try {
    const { query, page, limit } = (await request.json()) as { query?: string; page?: number; limit?: number };
    if (!query?.trim()) throw new Error("Enter a search query.");
    const result = await searchDailymotionVideos(query, page ?? 1, limit ?? 50, request.signal);
    return NextResponse.json({ manifest: createTemporarySearchManifest(query, result.items), page: result.page, total: result.total });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Search failed." }, { status: 400 });
  }
}

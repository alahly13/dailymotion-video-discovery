import { NextResponse } from "next/server";
import { applyAdvancedVideoFilters } from "@/lib/filters/apply-advanced-video-filters";
import type { AdvancedVideoFilters } from "@/types/filters";
import type { NormalizedVideoMetadata } from "@/types/video";

export async function POST(request: Request) {
  const { items, filters } = (await request.json()) as { items?: NormalizedVideoMetadata[]; filters?: AdvancedVideoFilters };
  return NextResponse.json({ items: applyAdvancedVideoFilters(items ?? [], filters ?? {}), originalCount: items?.length ?? 0 });
}

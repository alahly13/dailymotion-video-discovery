import { NextResponse } from "next/server";
import { analyzeDailymotionChannelInput } from "@/lib/platforms/dailymotion/dailymotion-url-analyzer";

export async function POST(request: Request) {
  try {
    const { input } = (await request.json()) as { input?: string };
    return NextResponse.json({ analysis: analyzeDailymotionChannelInput(input ?? "") });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to analyze input." }, { status: 400 });
  }
}

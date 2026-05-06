import { NextResponse } from "next/server";
import { AiRouteError, generateGeminiText } from "@/lib/ai/gemini-client";
import { AI_SAFETY_PROMPT } from "@/lib/ai/prompts";

export async function POST(request: Request) {
  try {
    const { manifest } = (await request.json()) as { manifest?: unknown };
    const text = await generateGeminiText(`${AI_SAFETY_PROMPT}\nSummarize this current manifest metadata without inventing videos: ${JSON.stringify(manifest).slice(0, 10000)}`);
    return NextResponse.json({ text });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "AI manifest summary failed." }, { status: 400 });
  }
}

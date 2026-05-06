import { NextResponse } from "next/server";
import { AiRouteError, generateGeminiText } from "@/lib/ai/gemini-client";
import { AI_SAFETY_PROMPT } from "@/lib/ai/prompts";

export async function POST(request: Request) {
  try {
    const { query } = (await request.json()) as { query?: string };
    if (!query?.trim()) throw new Error("Query is required.");
    const text = await generateGeminiText(`${AI_SAFETY_PROMPT}\nParse this public-video discovery query into safe JSON filters and keywords: ${query}`);
    return NextResponse.json({ text });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "AI query parsing failed." }, { status: 400 });
  }
}

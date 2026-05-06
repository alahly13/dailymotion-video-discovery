import { NextResponse } from "next/server";
import { generateGeminiText } from "@/lib/ai/gemini-client";
import { AI_SAFETY_PROMPT } from "@/lib/ai/prompts";

export async function POST(request: Request) {
  try {
    const { instruction, manifestSummary } = (await request.json()) as { instruction?: string; manifestSummary?: unknown };
    const text = await generateGeminiText(`${AI_SAFETY_PROMPT}\nOnly suggest filters for this current Channel Manifest summary: ${JSON.stringify(manifestSummary).slice(0, 6000)}\nInstruction: ${instruction ?? "Suggest useful filters."}`);
    return NextResponse.json({ text });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "AI filter helper failed." }, { status: 400 });
  }
}

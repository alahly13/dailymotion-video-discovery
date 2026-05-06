import { GoogleGenerativeAI } from "@google/generative-ai";
import { requireServerEnv } from "@/lib/config/env";

export function getGeminiModel() {
  const genAI = new GoogleGenerativeAI(requireServerEnv("GEMINI_API_KEY"));
  return genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
}

export async function generateGeminiText(prompt: string) {
  const model = getGeminiModel();
  const result = await model.generateContent(prompt);
  return result.response.text();
}

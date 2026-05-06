import { GoogleGenerativeAI } from "@google/generative-ai";

export class AiRouteError extends Error {
  constructor(message: string, public status = 503, public reason: string = "unavailable") { super(message); }
}

function getGeminiModel() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new AiRouteError("AI features are currently unavailable because GEMINI_API_KEY is not configured.", 503, "missing_config");
  const genAI = new GoogleGenerativeAI(key);
  return genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
}

export async function generateGeminiText(prompt: string) {
  try {
    const model = getGeminiModel();
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    if (!text?.trim()) throw new AiRouteError("AI returned an empty response.", 502, "invalid_response");
    return text;
  } catch (error) {
    if (error instanceof AiRouteError) throw error;
    throw new AiRouteError("AI service is temporarily unavailable.", 503, "network_error");
  }
}

import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "@/lib/config/env";

export class AiRouteError extends Error {
  constructor(message: string, public status = 503, public reason: string = "unavailable") { super(message); }
}

function getGeminiModel() {
  let key: string;
  try {
    key = env.geminiApiKey;
  } catch {
    throw new AiRouteError("AI features are currently unavailable because GEMINI_API_KEY is not configured.", 503, "missing_config");
  }

  const genAI = new GoogleGenerativeAI(key);

  // Gemini model selection belongs on the server with the API key. Future
  // browser code must not mirror this value into NEXT_PUBLIC_* because model
  // choice is part of the private AI route configuration surface.
  return genAI.getGenerativeModel({ model: env.geminiModel });
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

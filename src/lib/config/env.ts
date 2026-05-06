import { z } from "zod";

const requiredServerSchema = z.object({
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1),
  GEMINI_API_KEY: z.string().min(1),
});

const publicSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
});

const optionalServerSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  DAILYMOTION_API_BASE_URL: z.string().url().default("https://api.dailymotion.com"),
  DAILYMOTION_API_KEY: z.string().optional(),
  CRON_SECRET: z.string().optional(),
  WEBHOOK_SECRET: z.string().optional(),
  AI_EMBEDDING_MODEL: z.string().optional(),
  ENABLE_PGVECTOR: z.enum(["true", "false"]).default("false"),
  ENABLE_MANIFEST_PERSISTENCE: z.enum(["true", "false"]).default("true"),
  MAX_CHANNEL_FETCH_PAGES: z.coerce.number().int().positive().default(200),
  MAX_CHANNEL_FETCH_ITEMS: z.coerce.number().int().positive().default(10000),
  CHANNEL_FETCH_DELAY_MS: z.coerce.number().int().nonnegative().default(250),
});

export const serverEnv = requiredServerSchema.parse(process.env);
export const publicEnv = publicSchema.parse(process.env);
export const optionalServerEnv = optionalServerSchema.parse(process.env);

export const env = {
  geminiApiKey: serverEnv.GEMINI_API_KEY,
  databaseUrl: serverEnv.DATABASE_URL,
  directUrl: serverEnv.DIRECT_URL,
  dailymotionApiBaseUrl: optionalServerEnv.DAILYMOTION_API_BASE_URL,
  publicAppUrl: publicEnv.NEXT_PUBLIC_APP_URL,
};

export function requireServerEnv(name: "GEMINI_API_KEY" | "DATABASE_URL" | "DIRECT_URL") {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required on the server.`);
  return value;
}

export function getOptionalServerEnv(name: keyof typeof optionalServerEnv) {
  return optionalServerEnv[name];
}

export function getDailymotionConfig() {
  return {
    baseUrl: optionalServerEnv.DAILYMOTION_API_BASE_URL,
    apiKey: optionalServerEnv.DAILYMOTION_API_KEY?.trim() || "",
  };
}

export function getFetchSafetyConfig() {
  return {
    maxPages: optionalServerEnv.MAX_CHANNEL_FETCH_PAGES,
    maxItems: optionalServerEnv.MAX_CHANNEL_FETCH_ITEMS,
    delayMs: optionalServerEnv.CHANNEL_FETCH_DELAY_MS,
    manifestPersistenceEnabled: optionalServerEnv.ENABLE_MANIFEST_PERSISTENCE === "true",
  };
}

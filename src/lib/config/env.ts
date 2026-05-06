import { z } from "zod";

const postgresUrlSchema = z.string().url().refine((value) => {
  try {
    const protocol = new URL(value).protocol;
    return protocol === "postgres:" || protocol === "postgresql:";
  } catch {
    return false;
  }
}, "Must be a postgres:// or postgresql:// URL.");

const requiredServerSchema = z.object({
  DATABASE_URL: postgresUrlSchema,
  DIRECT_URL: postgresUrlSchema,
  GEMINI_API_KEY: z.string().min(1),
});

const publicSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
});


const isBuildTime = process.env.NEXT_PHASE === "phase-production-build";

function parseOrStub<T>(schema: z.ZodType<T>, values: unknown, stub: T, scope: string): T {
  const parsed = schema.safeParse(values);
  if (parsed.success) return parsed.data;
  if (isBuildTime) {
    console.warn(`⚠️ Skipping strict ${scope} env validation during Next.js production build.`);
    return stub;
  }
  throw parsed.error;
}

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

function isSupabaseDirectHost(raw: string) {
  try {
    return /^db\.[a-z0-9-]+\.supabase\.co$/i.test(new URL(raw).hostname);
  } catch {
    return false;
  }
}

export const serverEnv = parseOrStub(requiredServerSchema, process.env, {
  DATABASE_URL: "postgresql://build:build@localhost:5432/build",
  DIRECT_URL: "postgresql://build:build@localhost:5432/build",
  GEMINI_API_KEY: "build-placeholder",
}, "server");
export const publicEnv = parseOrStub(publicSchema, process.env, {
  NEXT_PUBLIC_APP_URL: "https://example.com",
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "build-placeholder",
}, "public");
export const optionalServerEnv = optionalServerSchema.parse(process.env);

if (isSupabaseDirectHost(serverEnv.DIRECT_URL)) {
  console.warn(
    "⚠️ DIRECT_URL uses Supabase direct host (db.<project-ref>.supabase.co). " +
      "This may fail in IPv4-only online environments (Vercel/Codespaces/GitHub Actions) unless IPv6 or Supabase IPv4 add-on is available."
  );
}

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

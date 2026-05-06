import { z } from "zod";
import { publicEnv } from "./public-env";

const postgresUrlSchema = z.string().url().refine((value) => {
  try {
    const protocol = new URL(value).protocol;
    return protocol === "postgres:" || protocol === "postgresql:";
  } catch {
    return false;
  }
}, "Must be a postgres:// or postgresql:// URL.");

const databaseSchema = z.object({
  DATABASE_URL: postgresUrlSchema,
});

const isBuildTime = process.env.NEXT_PHASE === "phase-production-build";

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

let hasWarnedSupabaseDirect = false;
let cachedDatabaseEnv: z.infer<typeof databaseSchema> | null = null;

export function getDatabaseEnv() {
  if (cachedDatabaseEnv) return cachedDatabaseEnv;

  const rawDatabaseUrl = process.env.DATABASE_URL?.trim();
  const values = {
    DATABASE_URL: rawDatabaseUrl,
  };

  const parsed = databaseSchema.safeParse(values);
  if (!parsed.success) {
    if (isBuildTime) {
      console.warn("[WARN] Skipping strict database env validation during Next.js production build.");
      cachedDatabaseEnv = {
        DATABASE_URL: "postgresql://build:build@localhost:5432/build",
      };
      return cachedDatabaseEnv;
    }

    throw parsed.error;
  }

  cachedDatabaseEnv = {
    DATABASE_URL: parsed.data.DATABASE_URL,
  };

  if (!hasWarnedSupabaseDirect && isSupabaseDirectHost(cachedDatabaseEnv.DATABASE_URL)) {
    console.warn(
      "[WARN] DATABASE_URL uses Supabase direct host (db.<project-ref>.supabase.co). " +
        "Use the Supabase Session Pooler URL for this project to avoid IPv4-limited connection failures."
    );
    hasWarnedSupabaseDirect = true;
  }

  return cachedDatabaseEnv;
}

export const optionalServerEnv = optionalServerSchema.parse(process.env);

export const env = {
  get geminiApiKey() {
    return requireServerEnv("GEMINI_API_KEY");
  },
  get databaseUrl() {
    return getDatabaseEnv().DATABASE_URL;
  },
  get dailymotionApiBaseUrl() {
    return optionalServerEnv.DAILYMOTION_API_BASE_URL;
  },
  get publicAppUrl() {
    return publicEnv.NEXT_PUBLIC_APP_URL;
  },
};

export function requireServerEnv(name: "GEMINI_API_KEY" | "DATABASE_URL") {
  if (name === "DATABASE_URL") return getDatabaseEnv().DATABASE_URL;

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

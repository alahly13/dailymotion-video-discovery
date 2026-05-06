import { z } from "zod";

const publicSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
});

const isBuildTime = process.env.NEXT_PHASE === "phase-production-build";

function parsePublicEnv() {
  const parsed = publicSchema.safeParse(process.env);
  if (parsed.success) return parsed.data;

  if (isBuildTime) {
    console.warn("[WARN] Skipping strict public env validation during Next.js production build.");
    return {
      NEXT_PUBLIC_APP_URL: "https://example.com",
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "build-placeholder",
    };
  }

  throw parsed.error;
}

export const publicEnv = parsePublicEnv();

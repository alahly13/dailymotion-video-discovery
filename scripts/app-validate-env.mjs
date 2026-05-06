#!/usr/bin/env node

import { loadProjectEnv } from "./load-project-env.mjs";

loadProjectEnv();

const PLACEHOLDER_PATTERNS = [
  /<[^>]+>/,
  /\[[^\]]+\]/,
  /your-/i,
  /placeholder/i,
  /example/i,
  /optional/i,
  /leave empty/i,
  /omit/i,
];

function parseUrl(raw) {
  try {
    return new URL(raw);
  } catch {
    return null;
  }
}

function looksLikePostgres(raw) {
  const parsed = parseUrl(raw);
  return parsed ? ["postgres:", "postgresql:"].includes(parsed.protocol) : false;
}

function isBlankOrPlaceholder(raw) {
  const value = raw?.trim() || "";
  return value.length === 0 || PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(value));
}

function validateRequired(name, options = {}) {
  const value = process.env[name]?.trim();
  if (isBlankOrPlaceholder(value)) return `${name} is missing or still contains a placeholder.`;

  if (options.kind === "url" && !parseUrl(value)) {
    return `${name} must be a valid URL.`;
  }

  if (options.kind === "postgres" && !looksLikePostgres(value)) {
    return `${name} must be a postgres:// or postgresql:// URL. Percent-encode reserved password characters such as #, @, ?, /, or $.`;
  }

  return null;
}

function main() {
  const failures = [
    validateRequired("DATABASE_URL", { kind: "postgres" }),
    validateRequired("GEMINI_API_KEY"),
    validateRequired("NEXT_PUBLIC_APP_URL", { kind: "url" }),
    validateRequired("NEXT_PUBLIC_SUPABASE_URL", { kind: "url" }),
    validateRequired("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
  ].filter(Boolean);

  if (failures.length > 0) {
    console.error("[ERROR] Build is missing required environment configuration:");
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    console.error("Use a root .env.local for local builds, or configure the same keys in Vercel Project Settings -> Environment Variables.");
    process.exit(1);
  }

  console.log("[OK] Required application environment variables are present for build/runtime.");
}

main();

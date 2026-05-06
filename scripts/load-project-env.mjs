#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { config as loadDotenv } from "dotenv";

let hasLoaded = false;
let hasWarnedUnsupportedLocalEnv = false;

const ENV_FILE_PRIORITY = [".env.local", ".env", ".env.development", ".env.production"];

function getUnsupportedEnvPaths() {
  return [path.join(process.cwd(), ".local.env"), path.join(process.cwd(), "src", ".local.env")];
}

export function getProjectEnvPaths() {
  return ENV_FILE_PRIORITY.map((name) => path.join(process.cwd(), name)).filter((candidate) => fs.existsSync(candidate));
}

export function loadProjectEnv({ silent = false } = {}) {
  if (!hasLoaded) {
    const envPaths = getProjectEnvPaths();
    if (envPaths.length > 0) {
      loadDotenv({
        path: envPaths,
        override: false,
        quiet: true,
      });
    }
    hasLoaded = true;
  }

  const unsupportedEnvPaths = getUnsupportedEnvPaths().filter((candidate) => fs.existsSync(candidate));
  if (!silent && !hasWarnedUnsupportedLocalEnv && unsupportedEnvPaths.length > 0) {
    const unsupportedLabels = unsupportedEnvPaths.map((candidate) => path.relative(process.cwd(), candidate)).join(", ");
    console.warn(
      `⚠️ Found unsupported env file(s): ${unsupportedLabels}. ` +
        "Next.js and Vercel auto-load .env.local at the project root, not .local.env variants. " +
        "Rename the file to .env.local or move the values into Vercel Project Settings -> Environment Variables."
    );
    hasWarnedUnsupportedLocalEnv = true;
  }
}

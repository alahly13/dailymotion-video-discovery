import { existsSync } from "node:fs";
import path from "node:path";
import { config as loadDotenv } from "dotenv";
import { defineConfig, env } from "prisma/config";

const envFiles = [".env.local", ".env", ".env.development", ".env.production"]
  .map((name) => path.join(process.cwd(), name))
  .filter((candidate) => existsSync(candidate));

if (envFiles.length > 0) {
  loadDotenv({ path: envFiles, override: false, quiet: true });
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // This project intentionally uses DATABASE_URL only for Prisma CLI and migrations.
    // DATABASE_URL should be the Supabase Session Pooler URL
    // (aws-0-<region>.pooler.supabase.com:5432/postgres). Supabase direct hosts can
    // fail in IPv4-limited environments, so they are not part of the active workflow.
    url: env("DATABASE_URL"),
  },
});

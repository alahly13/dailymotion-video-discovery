#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { loadProjectEnv } from "./load-project-env.mjs";

loadProjectEnv();

const shouldSkipValidation = process.argv.includes("--skip-validation");
const shouldAllowStatusFailure = process.argv.includes("--allow-status-failure");
const migrationsDir = path.join(process.cwd(), "prisma", "migrations");

function redact(text = "") {
  return String(text)
    .replace(/(postgres(?:ql)?:\/\/)[^\s'"`<>]+/gi, "$1[REDACTED_URL]")
    .replace(/(DATABASE_URL=)([^\s]+)/gi, "$1[REDACTED]");
}

function writeOutput(text, stream = process.stdout) {
  if (text) stream.write(redact(text));
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    shell: process.platform === "win32",
    env: process.env,
    ...options,
  });

  writeOutput(result.stdout, process.stdout);
  writeOutput(result.stderr, process.stderr);

  if (result.error) {
    console.error(`[ERROR] Failed to run ${command} ${args.join(" ")}: ${result.error.message}`);
  }

  return {
    status: typeof result.status === "number" ? result.status : result.error ? 1 : 0,
    output: `${result.stdout || ""}\n${result.stderr || ""}`,
  };
}

function runValidation() {
  const result = run("node", ["scripts/db-validate-env.mjs"]);
  if (result.status !== 0) process.exit(result.status);
}

function printTargetedHint(output) {
  if (/P1000/.test(output)) {
    console.error("[ERROR] Prisma reported P1000: database authentication failed.");
    console.error("- Verify the Supabase database password used in DATABASE_URL.");
    console.error("- Percent-encode reserved password characters such as #, @, ?, /, and $.");
    console.error("- Confirm the Session Pooler username shape is postgres.<project-ref>.");
    console.error("- Raw `prisma migrate status` can hide this as a bare schema-engine error; the connectivity preflight above is the concrete blocker.");
    return;
  }

  if (/P1001/.test(output)) {
    console.error("[ERROR] Prisma reported P1001: database host or port is unreachable.");
    console.error("- Keep DATABASE_URL on the Supabase Session Pooler host, not the direct db.<project-ref>.supabase.co host.");
    console.error("- Confirm the Supabase project is active and the pooler host/region are correct.");
    return;
  }

  if (/P1011/.test(output)) {
    console.error("[ERROR] Prisma reported P1011: TLS/SSL connection failed.");
    console.error("- Re-copy the Supabase Session Pooler connection string from the Supabase dashboard.");
    return;
  }

  console.error("[ERROR] Prisma database connectivity preflight failed.");
}

function hasCommittedMigrationFiles() {
  if (!fs.existsSync(migrationsDir)) return false;

  return fs.readdirSync(migrationsDir, { withFileTypes: true }).some((entry) => {
    if (!entry.isDirectory()) return false;
    return fs.existsSync(path.join(migrationsDir, entry.name, "migration.sql"));
  });
}

function printMigrationHistoryWarning() {
  if (!fs.existsSync(migrationsDir)) {
    console.warn("[WARN] Local migration history directory is missing: prisma/migrations.");
    console.warn("[WARN] This is not the current connection failure, but a committed baseline migration is required before deploy can apply schema changes.");
    return;
  }

  if (!hasCommittedMigrationFiles()) {
    console.warn("[WARN] No committed Prisma migration files were found under prisma/migrations.");
    console.warn("[WARN] Migration status can still diagnose connectivity, but deploy cannot create schema without reviewed migration files.");
  }
}

function printBaselineGuidance() {
  console.error("- The repo has no committed Prisma migration history for the current schema.");
  console.error("- Create a reviewed baseline migration before running db:apply against the real database.");
  console.error("- Do not use migrate reset or db push as the production repair path.");
}

function isApplyEligibleStatusFailure(output) {
  return [
    /migrations? have not yet been applied/i,
    /following migrations?.*not yet been applied/i,
    /_prisma_migrations.*(does not exist|not found|has not yet been created)/i,
    /no migration table/i,
  ].some((pattern) => pattern.test(output));
}

function runConnectivityPreflight() {
  let lastResult = null;

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    // Supabase Session Pooler DNS can surface transient reachability failures.
    // Retry P1001 once so the diagnostic can reveal a stable auth/config error
    // without turning status checks into a long-running loop.
    if (attempt > 1) {
      console.warn("[WARN] Retrying connectivity preflight once after P1001 reachability failure.");
    }

    lastResult = run("npx", ["prisma", "db", "execute", "--stdin"], { input: "SELECT 1;" });
    if (lastResult.status === 0) return lastResult;
    if (!/P1001/.test(lastResult.output)) return lastResult;
  }

  return lastResult;
}

function main() {
  if (!shouldSkipValidation) runValidation();

  // Status is the diagnostic surface for the repo's Prisma migration workflow.
  // Keep migration-history warnings separate from connectivity so future agents
  // do not mistake an empty repo history for a bad Supabase URL.
  printMigrationHistoryWarning();

  console.log("[INFO] Checking database connectivity with Prisma (SELECT 1, no application data).");
  const preflight = runConnectivityPreflight();

  if (preflight.status !== 0) {
    printTargetedHint(preflight.output);
    console.error("[INFO] Skipping prisma migrate status because the connectivity preflight failed first.");
    console.error("[INFO] DATABASE_URL remains the only supported database variable for this project.");
    process.exit(preflight.status || 1);
  }

  console.log("[INFO] Checking Prisma migration status...");
  const status = run("npx", ["prisma", "migrate", "status"]);
  let printedBaselineGuidance = false;

  if (status.status !== 0 && /Schema engine error:/i.test(status.output)) {
    console.error("[ERROR] Prisma migrate status returned a schema-engine error after connectivity succeeded.");
    if (!hasCommittedMigrationFiles()) {
      printBaselineGuidance();
      printedBaselineGuidance = true;
    }
    console.error("- Run the command again after migration history and database credentials are confirmed.");
  }

  if (status.status !== 0 && !hasCommittedMigrationFiles() && !printedBaselineGuidance) {
    printBaselineGuidance();
  }

  if (status.status !== 0 && shouldAllowStatusFailure && isApplyEligibleStatusFailure(status.output)) {
    console.warn("[WARN] Prisma migrate status reported pending or uninitialized migrations.");
    console.warn("[WARN] Continuing because --allow-status-failure was requested by the guarded apply workflow.");
    process.exit(0);
  }

  process.exit(status.status);
}

main();

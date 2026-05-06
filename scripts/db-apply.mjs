#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { loadProjectEnv } from "./load-project-env.mjs";

loadProjectEnv();

function runCommand(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    shell: process.platform === 'win32',
    env: process.env,
    ...options,
  });

  writeOutput(result.stdout, process.stdout);
  writeOutput(result.stderr, process.stderr);

  if (result.error) {
    if (result.error.code === 'ENOENT') {
      console.error(`[ERROR] Command not found: ${command}`);
      console.error('Next step: ensure dependencies are installed (`npm install`) and Prisma CLI is available.');
    } else {
      console.error(`[ERROR] Failed to run ${command} ${args.join(' ')}:`, result.error.message);
    }
    process.exit(1);
  }

  if (typeof result.status === 'number' && result.status !== 0) {
    process.exit(result.status);
  }
}

function redact(text = '') {
  return String(text)
    .replace(/(postgres(?:ql)?:\/\/)[^\s'"`<>]+/gi, '$1[REDACTED_URL]')
    .replace(/(DATABASE_URL=)([^\s]+)/gi, '$1[REDACTED]');
}

function writeOutput(text, stream = process.stdout) {
  if (text) stream.write(redact(text));
}

function parseMeta(raw) {
  try {
    const url = new URL(raw);
    if (!["postgres:", "postgresql:"].includes(url.protocol)) return null;
    return {
      protocol: url.protocol.replace(':', ''),
      host: url.hostname || '(missing-host)',
      port: url.port || '(default)',
      database: url.pathname?.replace(/^\//, '') || '(unknown)',
    };
  } catch {
    return null;
  }
}

function isProductionLikeHost(host = '') {
  return /(prod|production|live|primary|pooler\.supabase\.com|supabase\.com|supabase\.co)/i.test(host);
}

function validateEnv() {
  const databaseUrl = process.env.DATABASE_URL?.trim() || "";
  const dbMeta = parseMeta(databaseUrl);

  if (!dbMeta) {
    console.error('[ERROR] DATABASE_URL must be a valid postgres:// or postgresql:// URL.');
    console.error('Run `npm run db:validate` for details.');
    process.exit(1);
  }

  console.log('[INFO] Database target summary (sanitized):');
  console.log(`- DATABASE_URL host=${dbMeta.host}, port=${dbMeta.port}, database=${dbMeta.database}, protocol=${dbMeta.protocol}`);
  console.log('- Prisma CLI/migrations connection=DATABASE_URL only');

  if (isProductionLikeHost(dbMeta.host) || process.env.VERCEL_ENV === 'production') {
    console.warn('[WARN] Production-like database target detected.');
    if (process.env.CONFIRM_DB_APPLY !== 'true') {
      console.error('[ERROR] Refusing to run without explicit confirmation.');
      console.error('Re-run with: CONFIRM_DB_APPLY=true npm run db:apply');
      process.exit(1);
    }
  }
}

function printConnectionTroubleshooting() {
  console.error('Troubleshooting checklist:');
  console.error('- Use the Supabase Session Pooler URL for DATABASE_URL in Vercel/Codespaces/GitHub Actions.');
  console.error('- Verify Supabase password and project reference are correct.');
  console.error('- Avoid Supabase direct hosts for this workflow; they can fail with P1001 in IPv4-limited environments.');
}

function hasCommittedMigrationFiles() {
  const migrationsDir = path.join(process.cwd(), 'prisma', 'migrations');
  if (!fs.existsSync(migrationsDir)) return false;

  return fs.readdirSync(migrationsDir, { withFileTypes: true }).some((entry) => {
    if (!entry.isDirectory()) return false;
    return fs.existsSync(path.join(migrationsDir, entry.name, 'migration.sql'));
  });
}

function validateMigrationHistory() {
  // db:apply is the production-impacting path. It must only deploy reviewed
  // Prisma migration files owned by this repo, never infer schema changes from
  // schema.prisma or rely on db push/reset-style behavior.
  if (hasCommittedMigrationFiles()) return;

  console.error('[ERROR] No committed Prisma migration files were found under prisma/migrations.');
  console.error('Create and review a baseline migration history before running db:apply against the real database.');
  console.error('Do not use prisma migrate reset or prisma db push as the production repair path.');
  process.exit(1);
}

function main() {
  console.log('[INFO] Running migration preflight checks...');
  runCommand('node', ['scripts/db-validate-env.mjs']);
  validateEnv();
  validateMigrationHistory();

  console.log('[INFO] Checking migration status...');
  runCommand('node', ['scripts/db-status.mjs', '--skip-validation', '--allow-status-failure']);

  console.log('[INFO] Applying pending migrations (prisma migrate deploy)...');
  runCommand('npx', ['prisma', 'migrate', 'deploy']);

  console.log('[INFO] Regenerating Prisma client...');
  runCommand('npx', ['prisma', 'generate']);

  console.log('[INFO] Re-checking migration status...');
  runCommand('node', ['scripts/db-status.mjs', '--skip-validation']);

  console.log('[OK] Database migration apply workflow completed successfully.');
}

try {
  main();
} catch (error) {
  console.error('[ERROR] Migration workflow failed.');
  console.error(error instanceof Error ? error.message : String(error));
  printConnectionTroubleshooting();
  process.exit(1);
}

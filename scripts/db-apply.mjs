#!/usr/bin/env node

import { spawnSync } from 'node:child_process';

function runCommand(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: process.env,
    ...options,
  });

  if (result.error) {
    if (result.error.code === 'ENOENT') {
      console.error(`❌ Command not found: ${command}`);
      console.error('Next step: ensure dependencies are installed (`npm install`) and Prisma CLI is available.');
    } else {
      console.error(`❌ Failed to run ${command} ${args.join(' ')}:`, result.error.message);
    }
    process.exit(1);
  }

  if (typeof result.status === 'number' && result.status !== 0) {
    process.exit(result.status);
  }
}

function parseMeta(raw) {
  try {
    const url = new URL(raw);
    return {
      protocol: url.protocol.replace(':', ''),
      host: url.hostname || '(missing-host)',
      database: url.pathname?.replace(/^\//, '') || '(unknown)',
    };
  } catch {
    return null;
  }
}

function isPostgresUrl(raw) {
  try {
    const protocol = new URL(raw).protocol;
    return protocol === 'postgres:' || protocol === 'postgresql:';
  } catch {
    return false;
  }
}

function isProductionLikeHost(host = '') {
  return /(prod|production|live|primary|supabase\.co|supabase\.com|pooler\.supabase\.com)/i.test(host);
}

function validateEnv() {
  const required = ['DATABASE_URL', 'DIRECT_URL'];
  const missing = required.filter((k) => !process.env[k] || !process.env[k].trim());

  if (missing.length > 0) {
    console.error(`❌ Missing required environment variable(s): ${missing.join(', ')}`);
    console.error('Set DATABASE_URL and DIRECT_URL before running migrations.');
    process.exit(1);
  }

  const invalid = required.filter((k) => !isPostgresUrl(process.env[k]));
  if (invalid.length) {
    console.error(`❌ Invalid PostgreSQL URL(s): ${invalid.join(', ')}`);
    console.error('Use Supabase Postgres URLs from Dashboard → Connect.');
    process.exit(1);
  }

  const dbMeta = parseMeta(process.env.DATABASE_URL);
  const directMeta = parseMeta(process.env.DIRECT_URL);

  console.log('ℹ️ Database target summary (sanitized):');
  console.log(`- DATABASE_URL host=${dbMeta.host}, database=${dbMeta.database}, protocol=${dbMeta.protocol}`);
  console.log(`- DIRECT_URL host=${directMeta.host}, database=${directMeta.database}, protocol=${directMeta.protocol}`);

  if (isProductionLikeHost(dbMeta.host) || isProductionLikeHost(directMeta.host)) {
    console.warn('⚠️ Production-like database target detected.');
    if (process.env.CONFIRM_DB_APPLY !== 'true') {
      console.error('❌ Refusing to run without explicit confirmation.');
      console.error('Re-run with: CONFIRM_DB_APPLY=true npm run db:apply');
      process.exit(1);
    }
  }
}

function main() {
  console.log('🔎 Running migration preflight checks...');
  validateEnv();
  runCommand('node', ['scripts/db-validate-env.mjs']);

  console.log('📋 Checking migration status...');
  runCommand('npx', ['prisma', 'migrate', 'status']);

  console.log('🚀 Applying pending migrations (prisma migrate deploy)...');
  runCommand('npx', ['prisma', 'migrate', 'deploy']);

  console.log('🧱 Regenerating Prisma client...');
  runCommand('npx', ['prisma', 'generate']);

  console.log('✅ Database migration apply workflow completed successfully.');
}

try {
  main();
} catch (error) {
  console.error('❌ Migration workflow failed.');
  console.error(error instanceof Error ? error.message : String(error));
  console.error('Next steps: verify Supabase connection strings, network access, and committed prisma/migrations files.');
  process.exit(1);
}

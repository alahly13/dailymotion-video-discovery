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

function isProductionLikeHost(host = '') {
  return /(prod|production|live|primary|supabase\.co)/i.test(host);
}

function validateEnv() {
  const dbMeta = parseMeta(process.env.DATABASE_URL || '');
  const directMeta = parseMeta(process.env.DIRECT_URL || '');

  if (!dbMeta || !directMeta) {
    console.error('❌ DATABASE_URL and DIRECT_URL must be valid PostgreSQL URLs.');
    console.error('Run `npm run db:validate` for details.');
    process.exit(1);
  }

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

function printConnectionTroubleshooting() {
  console.error('Troubleshooting checklist:');
  console.error('- Prefer Supabase Session Pooler URL for DATABASE_URL in Vercel/Codespaces/GitHub Actions.');
  console.error('- If DIRECT_URL direct host fails, use the same Session Pooler URL as DATABASE_URL.');
  console.error('- Verify Supabase password and project reference are correct.');
  console.error('- Confirm environment IPv4/IPv6 support (direct db.<project-ref>.supabase.co may require IPv6).');
}

function main() {
  console.log('🔎 Running migration preflight checks...');
  runCommand('node', ['scripts/db-validate-env.mjs']);
  validateEnv();

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
  printConnectionTroubleshooting();
  process.exit(1);
}

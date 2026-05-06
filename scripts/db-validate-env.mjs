#!/usr/bin/env node

function maskUrl(raw) {
  try {
    const u = new URL(raw);
    return {
      protocol: u.protocol.replace(':', ''),
      host: u.hostname || '(missing-host)',
      port: u.port || '(default)',
      database: u.pathname?.replace(/^\//, '') || '(unknown)',
      sslmode: u.searchParams.get('sslmode') || '(not-set)',
    };
  } catch {
    return null;
  }
}

function looksLikePostgres(raw) {
  try {
    const u = new URL(raw);
    return ['postgres:', 'postgresql:'].includes(u.protocol);
  } catch {
    return false;
  }
}

function validate() {
  const required = ['DATABASE_URL', 'DIRECT_URL'];
  const missing = required.filter((k) => !process.env[k] || !process.env[k].trim());

  if (missing.length > 0) {
    console.error(`❌ Missing required environment variable(s): ${missing.join(', ')}`);
    console.error('Set these in GitHub Codespaces/GitHub Actions/Vercel or your local environment.');
    process.exit(1);
  }

  const invalid = required.filter((k) => !looksLikePostgres(process.env[k]));
  if (invalid.length > 0) {
    console.error(`❌ Invalid PostgreSQL connection URL(s): ${invalid.join(', ')}`);
    console.error('Expected postgres:// or postgresql:// URLs from Supabase Dashboard → Connect.');
    process.exit(1);
  }

  console.log('✅ Required database environment variables are present.');
  for (const key of required) {
    const details = maskUrl(process.env[key]);
    console.log(`- ${key}: protocol=${details.protocol}, host=${details.host}, port=${details.port}, database=${details.database}, sslmode=${details.sslmode}`);
  }

  console.log('🔒 Secrets were not printed.');
}

validate();

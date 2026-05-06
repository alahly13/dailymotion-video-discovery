#!/usr/bin/env node

function parseUrl(raw) {
  try {
    return new URL(raw);
  } catch {
    return null;
  }
}

function looksLikePostgres(raw) {
  const parsed = parseUrl(raw);
  return parsed ? ['postgres:', 'postgresql:'].includes(parsed.protocol) : false;
}

function classifyHost(host = '') {
  if (/\.pooler\.supabase\.com$/i.test(host)) return 'supabase-session-pooler';
  if (/^db\.[a-z0-9-]+\.supabase\.co$/i.test(host)) return 'supabase-direct';
  return 'custom-or-other';
}

function sanitizeMeta(raw) {
  const parsed = parseUrl(raw);
  if (!parsed) return null;

  return {
    protocol: parsed.protocol.replace(':', ''),
    host: parsed.hostname || '(missing-host)',
    port: parsed.port || '(default)',
    database: parsed.pathname?.replace(/^\//, '') || '(unknown)',
    hostType: classifyHost(parsed.hostname || ''),
  };
}

function validate() {
  const required = ['DATABASE_URL', 'DIRECT_URL'];
  const missing = required.filter((k) => !process.env[k] || !process.env[k].trim());

  if (missing.length > 0) {
    console.error(`❌ Missing required environment variable(s): ${missing.join(', ')}`);
    console.error('Set these in Vercel, GitHub Codespaces, GitHub Actions, or your local shell.');
    process.exit(1);
  }

  const invalid = required.filter((k) => !looksLikePostgres(process.env[k]));
  if (invalid.length > 0) {
    console.error(`❌ Invalid PostgreSQL connection URL(s): ${invalid.join(', ')}`);
    console.error('Expected postgres:// or postgresql:// URLs.');
    process.exit(1);
  }

  console.log('✅ Required database environment variables are present and valid PostgreSQL URLs.');

  for (const key of required) {
    const details = sanitizeMeta(process.env[key]);
    console.log(
      `- ${key}: protocol=${details.protocol}, host=${details.host}, port=${details.port}, database=${details.database}, host_type=${details.hostType}`
    );
  }

  const directHost = sanitizeMeta(process.env.DIRECT_URL)?.host || '';
  if (classifyHost(directHost) === 'supabase-direct') {
    console.warn(
      '⚠️ DIRECT_URL appears to use Supabase direct host (db.<project-ref>.supabase.co). ' +
        'This can fail in IPv4-only environments unless IPv6 or Supabase IPv4 add-on is available. ' +
        'Use Supabase Session Pooler for DIRECT_URL when needed.'
    );
  }

  if (process.env.DATABASE_URL === process.env.DIRECT_URL) {
    console.log('ℹ️ DIRECT_URL matches DATABASE_URL. This is allowed for Session Pooler-based IPv4-only workflows.');
  }

  console.log('🔒 Secrets were not printed.');
}

validate();

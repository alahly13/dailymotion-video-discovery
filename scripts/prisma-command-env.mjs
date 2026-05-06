const DEFAULT_CONNECT_TIMEOUT_SECONDS = "30";

function isPostgresProtocol(protocol = "") {
  return protocol === "postgres:" || protocol === "postgresql:";
}

function readConnectTimeoutSeconds() {
  const configured = process.env.PRISMA_CONNECT_TIMEOUT_SECONDS?.trim();
  if (configured && /^\d+$/.test(configured) && Number(configured) > 0) {
    return configured;
  }

  return DEFAULT_CONNECT_TIMEOUT_SECONDS;
}

export function applyPrismaCommandConnectionDefaults() {
  const rawDatabaseUrl = process.env.DATABASE_URL?.trim();
  if (!rawDatabaseUrl) return;

  let databaseUrl;
  try {
    databaseUrl = new URL(rawDatabaseUrl);
  } catch {
    return;
  }

  if (!isPostgresProtocol(databaseUrl.protocol) || databaseUrl.searchParams.has("connect_timeout")) {
    return;
  }

  const timeoutSeconds = readConnectTimeoutSeconds();
  databaseUrl.searchParams.set("connect_timeout", timeoutSeconds);
  process.env.DATABASE_URL = databaseUrl.toString();

  // This applies only to Prisma CLI child processes launched by db:status/db:apply.
  // It follows Supabase's P1001 troubleshooting guidance without changing the
  // operator's stored DATABASE_URL, target host, credentials, or project env files.
  console.log(
    `[INFO] Prisma command connection default applied: connect_timeout=${timeoutSeconds} seconds (process-only; env file unchanged).`
  );
}

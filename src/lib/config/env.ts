export const env = {
  geminiApiKey: process.env.GEMINI_API_KEY,
  databaseUrl: process.env.DATABASE_URL ?? "file:./dev.db",
  dailymotionApiBaseUrl: process.env.DAILYMOTION_API_BASE_URL ?? "https://api.dailymotion.com",
  publicAppUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
};

export function requireServerEnv(name: "GEMINI_API_KEY") {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required on the server.`);
  return value;
}

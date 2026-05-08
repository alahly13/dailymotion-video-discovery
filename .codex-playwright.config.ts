import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: ".codex-responsive-smoke.spec.ts",
  timeout: 60_000,
  reporter: [["list"]],
  use: {
    baseURL: "http://127.0.0.1:3005",
    browserName: "chromium",
    channel: "msedge",
    headless: true,
    navigationTimeout: 30_000,
    actionTimeout: 15_000,
  },
});

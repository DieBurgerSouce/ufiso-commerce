import { defineConfig, devices } from "@playwright/test";

// Hofladen-Storefront laeuft Default auf Port 3001 (Tropfshop besetzt 3000).
const PORT = Number(process.env.PORT ?? "3001");
const baseURL = `http://localhost:${PORT}`;

/**
 * Playwright-Config Hofladen-Storefront (Sprint 11 C.3).
 * Spiegelt die Tropfshop-Config; minimaler E2E-Scope, weil Sprint 11
 * der FUNKTIONALE Stresstest ist und keine Visual-Coverage anstrebt.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "node node_modules/next/dist/bin/next start",
    url: baseURL,
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
    env: {
      PORT: String(PORT),
      NEXT_PUBLIC_ENABLE_TEST_BRIDGE: "1",
    },
  },
});

import { defineConfig, devices } from "@playwright/test";

// PORT kann per ENV ueberschrieben werden — Default 3000 (CORS/CI), lokal
// koennen Tests mit `PORT=3001 npx playwright test` auf einen freien Port
// ausweichen, falls ein anderer `next start` blockiert.
const PORT = Number(process.env.PORT ?? "3000");
const baseURL = `http://localhost:${PORT}`;

/**
 * Playwright-Config Tropfshop-Storefront.
 * Smoke-Tests laufen in CI; die Pflicht-Launch-Flows (e2e/critical) sind bis
 * zum funktionsfähigen Shop als test.fixme markiert (Vault: Test-Strategie).
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
    // Direkt `next start` ueber den lokalen Bin — bypasst die pnpm-Vor-
    // Pruefung `verify-deps-before-run`, die bei ignorierten
    // Build-Scripts (z. B. `@parcel/watcher`) den Boot fehlschlagen laesst.
    command: "node node_modules/next/dist/bin/next start",
    url: baseURL,
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
    env: {
      PORT: String(PORT),
    },
  },
});

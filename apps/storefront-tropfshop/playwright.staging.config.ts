import { defineConfig } from "@playwright/test";

/**
 * Playwright-Config NUR fuer Staging-E2E gegen die Vercel-Preview-URL.
 *
 * Unterschied zur Default-Config:
 *  - kein lokales `webServer`-Boot (die Tests gehen gegen einen externen
 *    Host, der ueber `BREVO_E2E_BASE_URL` in der Spec konfiguriert wird).
 *  - `testDir` ist auf `e2e/staging/**` eingeengt — keine Coming-Soon-,
 *    Consent-, Lighthouse-Specs mitschleppen.
 *  - im CI nightly-Runner einmal pro Tag — kein Retry, deutlicher Fail.
 *
 * Aktivierung passiert weiterhin in der Spec selbst via `BREVO_E2E_ENABLED=1`
 * (sonst skip), siehe `apps/storefront-tropfshop/e2e/staging/brevo-doi-submit.spec.ts`.
 */
export default defineConfig({
  testDir: "./e2e/staging",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  timeout: 60_000,
});

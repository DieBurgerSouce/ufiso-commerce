import { expect, test } from "@playwright/test";

/**
 * Staging-E2E: Newsletter-DOI-Submit gegen die Vercel-Preview-Storefront
 * mit echter Brevo-API-Verifikation + Cleanup-After.
 *
 * Laeuft NICHT im Default-Playwright-Run — env-gated, damit lokales
 * `pnpm test:e2e` und das CI-`e2e-with-backend` keine Live-Brevo-
 * Submits triggern. Aktivierung:
 *
 *   $env:BREVO_E2E_ENABLED        = "1"
 *   $env:BREVO_E2E_API_KEY        = "xkeysib-..."
 *   $env:BREVO_E2E_BASE_URL       = "https://<vercel-preview>.vercel.app"
 *   $env:BREVO_E2E_LIST_ID        = "3"
 *   $env:BREVO_E2E_EMAIL_PREFIX   = "ben.firmenich+sprint10-e2e"   # optional
 *
 * Vault-Begleitung: Runbook apps/docs/runbooks/brevo-roundtrip.md.
 *
 * Cleanup-After: DELETE /v3/contacts/{email} wird IMMER ausgefuehrt
 * (auch wenn die Assertions failen), damit Brevo-Liste 3 sauber bleibt.
 */

const ENABLED = process.env.BREVO_E2E_ENABLED === "1";
const API_KEY = process.env.BREVO_E2E_API_KEY ?? "";
const BASE_URL = process.env.BREVO_E2E_BASE_URL ?? "";
const EMAIL_PREFIX = process.env.BREVO_E2E_EMAIL_PREFIX ?? "ben.firmenich+sprint10-e2e";

test.describe("Brevo DOI-Submit gegen Vercel-Preview", () => {
  test.skip(!ENABLED, "BREVO_E2E_ENABLED nicht gesetzt — Staging-E2E deaktiviert");
  test.skip(
    !API_KEY || !BASE_URL,
    "BREVO_E2E_API_KEY oder BREVO_E2E_BASE_URL fehlt",
  );

  test("Submit -> 200 + Brevo-Eintrag existiert + Cleanup", async ({ request }) => {
    const ts = Date.now();
    const email = `${EMAIL_PREFIX}-${ts}@gmail.com`;

    try {
      // 1. Submit gegen die Vercel-Storefront /api/newsletter
      const submitRes = await request.post(`${BASE_URL}/api/newsletter`, {
        headers: { "Content-Type": "application/json" },
        data: { email, source: "sprint10-e2e" },
      });
      expect(submitRes.status(), "Submit muss 200 zurueckgeben").toBe(200);
      const submitBody = await submitRes.json();
      expect(submitBody.message ?? "").toMatch(/bestätigen|eingetragen/i);

      // 2. Brevo-API verifizieren — der Contact existiert direkt nach Submit
      //    (auch im DOI-Pending-Status), erst nach Confirm-Klick landet er
      //    in der Ziel-Liste. /v3/contacts/{email} liefert 200 fuer beide
      //    Zustaende.
      const enc = encodeURIComponent(email);
      let brevoRes: Response | null = null;
      // Eventual consistency: bis zu 5 s polling, bis Brevo den Contact zeigt.
      const deadline = Date.now() + 5_000;
      while (Date.now() < deadline) {
        brevoRes = await fetch(`https://api.brevo.com/v3/contacts/${enc}`, {
          headers: { "api-key": API_KEY, accept: "application/json" },
        });
        if (brevoRes.status === 200) break;
        await new Promise((r) => setTimeout(r, 500));
      }
      expect(brevoRes, "Brevo-Lookup muss eine Response liefern").not.toBeNull();
      expect(brevoRes!.status, "Brevo /v3/contacts/{email} muss 200 zurueckgeben").toBe(200);
      const contact = (await brevoRes!.json()) as { email: string };
      expect(contact.email.toLowerCase()).toBe(email.toLowerCase());
    } finally {
      // 3. Cleanup-After — IMMER, auch wenn Asserts failten.
      const enc = encodeURIComponent(email);
      await fetch(`https://api.brevo.com/v3/contacts/${enc}`, {
        method: "DELETE",
        headers: { "api-key": API_KEY, accept: "application/json" },
      }).catch(() => {
        /* best-effort */
      });
    }
  });
});

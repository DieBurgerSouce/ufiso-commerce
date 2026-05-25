import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page, type Request } from "@playwright/test";

/**
 * Klaro-Consent — E2E-Akzeptanz Sprint 7.
 *
 * Pflicht aus Goal:
 *  - Banner Erstbesuch sichtbar
 *  - "Ablehnen" → KEIN POST auf /api/log-client-error
 *  - "Akzeptieren" → POST auf /api/log-client-error
 *  - Footer-"Cookie-Einstellungen" oeffnet den Manager erneut
 *  - axe-core auf geoeffnetem Banner: 0 critical/serious
 *
 * Das eigentliche Reporter-Modul (`lib/report-client-error.ts`) wird ueber
 * `window.__reportClientError` (siehe `TestErrorBridge`) angesteuert —
 * damit testen wir die echte Production-Logik inklusive Klaro-Cookie-Gate,
 * ohne den React-Render-Error-Mechanismus zu triggern.
 */

const CONSENT_COOKIE = "klaro-tropfshop";
const LOG_PATH = "/api/log-client-error";

/**
 * Liest den Consent-Status fuer einen Service aus dem Klaro-Cookie.
 * Mirror der Logik in `lib/consent.ts` — Klaro 0.7 schreibt eine flache
 * Map `{"service": bool}`, evtl. spaetere Versionen ein `{consents: {...}}`.
 */
function readKlaroService(rawValue: string, serviceName: string): boolean {
  const parsed = JSON.parse(decodeURIComponent(rawValue)) as Record<
    string,
    unknown
  > & { consents?: Record<string, boolean> };
  if (parsed.consents && typeof parsed.consents === "object") {
    return parsed.consents[serviceName] === true;
  }
  return parsed[serviceName] === true;
}

async function clearKlaroCookie(page: Page) {
  const context = page.context();
  const cookies = await context.cookies();
  await context.clearCookies();
  // Sicherheit: einen evtl. von einer vorigen Page noch persistenten
  // Klaro-Cookie loeschen.
  const keep = cookies.filter((c) => c.name !== CONSENT_COOKIE);
  if (keep.length > 0) {
    await context.addCookies(keep);
  }
}

async function waitForBannerVisible(page: Page) {
  // Klaro 0.7 rendert in `#klaro` und versieht das Modal mit der Klasse
  // `cookie-modal`. Wir suchen ueber Rolle/Text statt CSS-Klasse —
  // robuster gegenueber Theme-Updates.
  await expect(
    page.getByRole("button", { name: /Alle akzeptieren/i }),
  ).toBeVisible({ timeout: 10_000 });
  await expect(
    page.getByRole("button", { name: /Ablehnen/i }),
  ).toBeVisible();
}

async function triggerTestReport(page: Page) {
  await page.evaluate(async () => {
    const w = window as Window & {
      __reportClientError?: (report: {
        message: string;
        stack: string;
        pathname: string;
      }) => Promise<void>;
    };
    if (!w.__reportClientError) {
      throw new Error("TestErrorBridge fehlt — __reportClientError nicht da");
    }
    await w.__reportClientError({
      message: "e2e synthetic",
      stack: "e2e synthetic stack",
      pathname: "/",
    });
  });
}

function setupLogSpy(page: Page) {
  const seen: Request[] = [];
  page.on("request", (req) => {
    if (req.method() === "POST" && req.url().endsWith(LOG_PATH)) {
      seen.push(req);
    }
  });
  return seen;
}

test.describe("Klaro · Consent-Banner", () => {
  test.beforeEach(async ({ page }) => {
    await clearKlaroCookie(page);
  });

  test("zeigt das Banner beim Erstbesuch (3 Buttons sichtbar)", async ({
    page,
  }) => {
    await page.goto("/");
    await waitForBannerVisible(page);

    // "Einstellungen anpassen" ist der dritte Button (Klaro `learnMore`).
    await expect(
      page.getByRole("button", { name: /Einstellungen anpassen/i }),
    ).toBeVisible();
  });

  test("Banner-DOM hat 0 critical/serious axe-Verstoesse", async ({ page }) => {
    await page.goto("/");
    await waitForBannerVisible(page);

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    const blocking = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious",
    );

    if (blocking.length > 0) {
      const details = blocking
        .map(
          (v) =>
            `[${v.impact}] ${v.id}: ${v.help}\n  Nodes: ${v.nodes
              .map((n) => n.target.join(" "))
              .join(", ")}`,
        )
        .join("\n\n");
      throw new Error(
        `[a11y · Banner] ${blocking.length} blocking violation(s):\n${details}`,
      );
    }

    expect(blocking).toHaveLength(0);
  });

  test("Ablehnen → KEIN POST auf /api/log-client-error", async ({ page }) => {
    const seen = setupLogSpy(page);

    await page.goto("/");
    await waitForBannerVisible(page);

    await page.getByRole("button", { name: /Ablehnen/i }).click();

    // Banner sollte verschwinden — bestaetigt, dass der Cookie geschrieben wurde.
    await expect(
      page.getByRole("button", { name: /Alle akzeptieren/i }),
    ).toBeHidden({ timeout: 5_000 });

    // Cookie-Inhalt verifizieren: betterstack-telemetry MUSS false sein.
    // Klaro 0.7 schreibt die Consent-Map flach (`{service: bool}`) — der
    // Helper handhabt auch eine moeglicherweise umhuellte Variante.
    const cookies = await page.context().cookies();
    const klaro = cookies.find((c) => c.name === CONSENT_COOKIE);
    expect(klaro).toBeTruthy();
    expect(readKlaroService(klaro!.value, "betterstack-telemetry")).toBe(
      false,
    );

    // Den echten Reporter triggern — er muss dank Consent-Gate NICHTS senden.
    await triggerTestReport(page);
    await page.waitForTimeout(500);

    expect(seen).toHaveLength(0);
  });

  test("Akzeptieren → POST auf /api/log-client-error", async ({ page }) => {
    const seen = setupLogSpy(page);

    await page.goto("/");
    await waitForBannerVisible(page);

    await page.getByRole("button", { name: /Alle akzeptieren/i }).click();

    await expect(
      page.getByRole("button", { name: /Alle akzeptieren/i }),
    ).toBeHidden({ timeout: 5_000 });

    const cookies = await page.context().cookies();
    const klaro = cookies.find((c) => c.name === CONSENT_COOKIE);
    expect(klaro).toBeTruthy();
    expect(readKlaroService(klaro!.value, "betterstack-telemetry")).toBe(
      true,
    );


    // Achtung: Der Reporter feuert `fetch(..., { keepalive: true })`. Der
    // Browser fired den Request, bricht ihn aber als ERR_ABORTED ab — eine
    // Response gibt es nicht. Wir warten daher auf den REQUEST, nicht die
    // Response.
    const requestPromise = page.waitForRequest(
      (req) => req.url().endsWith(LOG_PATH) && req.method() === "POST",
      { timeout: 5_000 },
    );
    await triggerTestReport(page);
    await requestPromise;

    expect(seen.length).toBeGreaterThanOrEqual(1);
  });

  test("Footer-Cookie-Einstellungen oeffnet das Banner erneut", async ({
    page,
  }) => {
    await page.goto("/");
    await waitForBannerVisible(page);

    await page.getByRole("button", { name: /Ablehnen/i }).click();
    await expect(
      page.getByRole("button", { name: /Alle akzeptieren/i }),
    ).toBeHidden({ timeout: 5_000 });

    // Im Footer liegt der CookieSettingsButton mit Label "Cookie-Einstellungen".
    // (Klaro 0.7 nutzt "Einstellungen anpassen", deshalb hier exakter Match.)
    await page
      .getByRole("button", { name: "Cookie-Einstellungen", exact: true })
      .click();

    // `klaro.show()` oeffnet die Settings-Ansicht (cookie-modal) — die
    // hat "Speichern" + "Schliessen" statt "Alle akzeptieren/Ablehnen".
    await expect(page.locator(".klaro .cookie-modal")).toBeVisible({
      timeout: 5_000,
    });
    await expect(
      page.getByRole("button", { name: /Speichern/i }),
    ).toBeVisible();
  });
});

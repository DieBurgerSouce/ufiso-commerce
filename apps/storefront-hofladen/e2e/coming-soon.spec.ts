import { expect, test } from "@playwright/test";

/**
 * Smoke-Tests Hofladen-Storefront (Sprint 11 C.3 — FUNKTIONALER Stresstest).
 *
 * Beweist:
 *  - Brand-Name "Hofladen" sichtbar
 *  - Newsletter-Form vorhanden
 *  - Klaro-Cookie ist `klaro-hofladen` (Multi-Brand-Pattern: shop-eindeutig
 *    gegen `klaro-tropfshop`)
 *  - Coming-Soon-Tiles haben mindestens 4 HOF- (Hofladen-) Mock-Tiles
 *
 * KEIN Visual-Polishing-Test (Hero-Bilder, Farb-Paletten) — das ist
 * Sprint 12, sobald der Brand-Style finalisiert ist.
 */
test.describe("Hofladen — Coming-Soon-Page", () => {
  test("zeigt den Brand-Namen Hofladen in der Headline", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Hofladen",
    );
  });

  test("Newsletter-Formular ist vorhanden und bedienbar", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByPlaceholder("ihre@email.de")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Benachrichtigen" }),
    ).toBeEnabled();
    await expect(page.getByRole("checkbox")).toBeVisible();
  });

  test("Klaro-Banner setzt den Hofladen-spezifischen Cookie", async ({
    page,
  }) => {
    await page.context().clearCookies();
    await page.goto("/");

    // Banner kommt — auf das Klaro-Modal warten.
    await expect(
      page.getByRole("button", { name: /Alle akzeptieren/i }),
    ).toBeVisible({ timeout: 10_000 });

    await page.getByRole("button", { name: /Alle akzeptieren/i }).click();

    // Banner verschwindet, sobald Klaro den Cookie geschrieben hat.
    await expect(
      page.getByRole("button", { name: /Alle akzeptieren/i }),
    ).toBeHidden({ timeout: 5_000 });

    const cookies = await page.context().cookies();
    const klaro = cookies.find((c) => c.name === "klaro-hofladen");
    expect(
      klaro,
      "Hofladen-Klaro-Cookie 'klaro-hofladen' muss existieren — andere Brand-Cookies (z. B. klaro-tropfshop) duerfen nicht stattdessen gesetzt werden",
    ).toBeTruthy();
  });

  test("zeigt mindestens 4 Mock-Tiles mit 'Bald verfügbar'-Badge", async ({
    page,
  }) => {
    await page.goto("/");
    const tilesSection = page.getByRole("region", {
      name: /das wird's bei uns geben/i,
    });
    await expect(tilesSection).toBeVisible();

    const badges = tilesSection.getByText(/bald verfügbar/i);
    await expect(badges.first()).toBeVisible();
    expect(await badges.count()).toBeGreaterThanOrEqual(4);
  });
});

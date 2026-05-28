import { expect, test, type Page } from "@playwright/test";

/**
 * Katalog-Tests (Sprint 12). Backend-abhaengig (wie der Coming-Soon-Tiles-Test):
 * setzt voraus, dass das Medusa-Backend erreichbar und geseedet ist (CI-Job
 * "e2e-with-backend"). Phase 1: keine Preise, kein Warenkorb.
 */

/**
 * Der Klaro-Consent-Banner (Sprint 7) legt sich beim Erstbesuch als Overlay
 * (`#klaro .cm-bg`) ueber die Seite und faengt Klicks ab. Vor jeder Navigation
 * per Klick muss er weg — der Consent-Wert ist hier egal (wir testen Routing,
 * nicht Telemetrie), daher "Alle akzeptieren".
 */
async function dismissConsent(page: Page) {
  const accept = page.getByRole("button", { name: /Alle akzeptieren/i });
  await accept.click({ timeout: 10_000 });
  await expect(accept).toBeHidden({ timeout: 5_000 });
}

test.describe("Katalog · Sortiment-Uebersicht", () => {
  test("zeigt die Ueberschrift und Produkt-Tiles", async ({ page }) => {
    await page.goto("/produkte");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Sortiment",
    );

    const productLinks = page.locator(
      'a[href^="/produkte/"]:not([href^="/produkte/kategorie/"])',
    );
    expect(await productLinks.count()).toBeGreaterThanOrEqual(1);
    await expect(page.getByText(/bald verfügbar/i).first()).toBeVisible();
  });

  test("fuehrt von einer Kachel zur Produkt-Detailseite", async ({ page }) => {
    await page.goto("/produkte");
    await dismissConsent(page);
    const productLink = page
      .locator('a[href^="/produkte/"]:not([href^="/produkte/kategorie/"])')
      .first();
    await productLink.click();

    await expect(page).toHaveURL(/\/produkte\/[^/]+$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText(/bald verfügbar/i).first()).toBeVisible();
    // PDP-lite fuehrt zum Newsletter (kein Warenkorb in Phase 1).
    await expect(page.getByPlaceholder("ihre@email.de")).toBeVisible();
  });
});

test.describe("Katalog · Kategorie-Seite", () => {
  test("oeffnet eine Kategorie ueber 'Alle ansehen'", async ({ page }) => {
    await page.goto("/produkte");
    await dismissConsent(page);
    const categoryLink = page
      .locator('a[href^="/produkte/kategorie/"]')
      .first();
    await categoryLink.click();

    await expect(page).toHaveURL(/\/produkte\/kategorie\//);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});

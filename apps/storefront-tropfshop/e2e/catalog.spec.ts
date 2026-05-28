import { expect, test } from "@playwright/test";

/**
 * Katalog-Tests (Sprint 12). Backend-abhaengig (wie der Coming-Soon-Tiles-Test):
 * setzt voraus, dass das Medusa-Backend erreichbar und geseedet ist (CI-Job
 * "e2e-with-backend"). Phase 1: keine Preise, kein Warenkorb.
 */

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
    const categoryLink = page
      .locator('a[href^="/produkte/kategorie/"]')
      .first();
    await categoryLink.click();

    await expect(page).toHaveURL(/\/produkte\/kategorie\//);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});

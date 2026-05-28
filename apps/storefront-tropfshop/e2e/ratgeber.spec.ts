import { expect, test } from "@playwright/test";

/**
 * Ratgeber-Tests (Sprint 12). Voll statisch (lib/ratgeber.ts) — unabhaengig
 * vom Backend, laufen in jedem E2E-Setup.
 */

test.describe("Ratgeber · Uebersicht", () => {
  test("listet die Artikel mit Titel + Lesezeit", async ({ page }) => {
    await page.goto("/ratgeber");
    await expect(
      page.getByRole("heading", { level: 1 }),
    ).toContainText("Ratgeber Tropfbewässerung");

    // Mindestens 3 Artikel-Links (drei Start-Artikel).
    const articleLinks = page.locator('a[href^="/ratgeber/"]');
    expect(await articleLinks.count()).toBeGreaterThanOrEqual(3);
  });
});

test.describe("Ratgeber · Artikel", () => {
  const articlePath = "/ratgeber/tropfbewaesserung-hochbeet-planen";

  test("rendert Titel, Sektionen und FAQ", async ({ page }) => {
    await page.goto(articlePath);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Hochbeet",
    );
    // Mindestens eine inhaltliche Sektion (h2) plus die FAQ-Ueberschrift.
    await expect(
      page.getByRole("heading", { name: "Häufige Fragen" }),
    ).toBeVisible();
    expect(await page.getByRole("heading", { level: 2 }).count()).toBeGreaterThan(
      1,
    );
  });

  test("verlinkt auf passende Produkt-Kategorien", async ({ page }) => {
    await page.goto(articlePath);
    const categoryLink = page
      .locator('a[href^="/produkte/kategorie/"]')
      .first();
    await expect(categoryLink).toBeVisible();
    await categoryLink.click();
    await expect(page).toHaveURL(/\/produkte\/kategorie\//);
  });

  test("hat eine Newsletter-Anmeldung im Artikel", async ({ page }) => {
    await page.goto(articlePath);
    await expect(page.getByPlaceholder("ihre@email.de")).toBeVisible();
  });
});

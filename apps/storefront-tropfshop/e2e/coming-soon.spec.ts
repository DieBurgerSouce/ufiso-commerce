import { test, expect } from "@playwright/test";

/**
 * Smoke-Tests fuer die Pre-Launch-Page. Laufen in CI vor jedem Merge.
 */
test.describe("Coming-Soon-Page", () => {
  test("zeigt die Hero-Botschaft", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { level: 1 }),
    ).toContainText("Tropfbewässerung");
  });

  test("Newsletter-Formular ist vorhanden und bedienbar", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByPlaceholder("ihre@email.de")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Benachrichtigen" }),
    ).toBeEnabled();
    await expect(page.getByRole("checkbox")).toBeVisible();
  });

  test("E-Mail-Feld erzwingt eine gültige Adresse", async ({ page }) => {
    await page.goto("/");
    const email = page.getByPlaceholder("ihre@email.de");
    await expect(email).toHaveAttribute("type", "email");
    await expect(email).toHaveAttribute("required", "");
  });
});

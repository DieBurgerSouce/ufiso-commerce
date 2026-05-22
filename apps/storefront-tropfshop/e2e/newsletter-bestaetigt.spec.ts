import { test, expect } from "@playwright/test";

/**
 * Smoke-Test fuer die DOI-Landing-Page (Brevo-Redirect nach Bestaetigung).
 * Vault: 05-Content-und-SEO/Pre-Launch-Newsletter.md
 */
test.describe("Newsletter-Bestaetigt-Page", () => {
  test("rendert die Bestaetigungsbotschaft", async ({ page }) => {
    await page.goto("/newsletter-bestaetigt");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Anmeldung bestätigt",
    );
  });

  test("verlinkt zurueck zur Startseite", async ({ page }) => {
    await page.goto("/newsletter-bestaetigt");
    const link = page.getByRole("link", { name: /zurück zur startseite/i });
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL("/");
  });

  test("ist auf noindex/nofollow gesetzt", async ({ page }) => {
    await page.goto("/newsletter-bestaetigt");
    const robots = page.locator('meta[name="robots"]');
    await expect(robots).toHaveAttribute("content", /noindex/);
    await expect(robots).toHaveAttribute("content", /nofollow/);
  });
});

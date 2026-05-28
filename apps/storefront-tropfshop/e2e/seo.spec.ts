import { expect, test } from "@playwright/test";

/**
 * SEO-Hygiene-Smoke-Tests.
 *
 * Pruefen, dass die Pre-Launch-SEO-Grundlagen ausgeliefert werden
 * (robots/sitemap erreichbar, OG-Image-Meta gesetzt, Organization-JSON-LD
 * vorhanden). Vollindex-Switch erfolgt zum Launch — siehe Vault
 * 05-Content-und-SEO/SEO-Strategie.md "Technical SEO".
 */

test.describe("SEO · robots.txt", () => {
  test("ist erreichbar und disallowed alles in Phase 1", async ({ request }) => {
    const response = await request.get("/robots.txt");
    expect(response.status()).toBe(200);

    const body = await response.text();
    expect(body).toMatch(/^User-Agent:\s*\*/im);
    expect(body).toMatch(/^Disallow:\s*\//im);
    expect(body).toMatch(/sitemap\.xml/i);
  });
});

test.describe("SEO · sitemap.xml", () => {
  test("ist erreichbar und enthaelt die Pre-Launch-Routen", async ({
    request,
  }) => {
    const response = await request.get("/sitemap.xml");
    expect(response.status()).toBe(200);

    const body = await response.text();
    expect(body).toContain("<urlset");
    expect(body).toMatch(/<loc>https:\/\/tropfshop\.de\/?<\/loc>/);
    expect(body).toContain("/newsletter-bestaetigt");
  });

  test("enthaelt die indexierbaren Ratgeber-URLs (Sprint 12)", async ({
    request,
  }) => {
    const response = await request.get("/sitemap.xml");
    const body = await response.text();
    expect(body).toContain("/ratgeber");
    expect(body).toContain("/ratgeber/tropfbewaesserung-hochbeet-planen");
  });
});

test.describe("SEO · robots.txt Ratgeber-Freigabe (Sprint 12)", () => {
  test("erlaubt /ratgeber trotz globalem Disallow", async ({ request }) => {
    const response = await request.get("/robots.txt");
    const body = await response.text();
    // Global bleibt disallowed ...
    expect(body).toMatch(/^Disallow:\s*\//im);
    // ... aber der Ratgeber ist explizit freigegeben.
    expect(body).toMatch(/^Allow:\s*\/ratgeber/im);
  });
});

test.describe("SEO · Ratgeber-Artikel ist indexierbar + Article-JSON-LD", () => {
  const articlePath = "/ratgeber/tropfbewaesserung-hochbeet-planen";

  test("setzt robots auf indexierbar (kein noindex)", async ({ page }) => {
    await page.goto(articlePath);
    const robots = await page
      .locator('head meta[name="robots"]')
      .first()
      .getAttribute("content");
    expect(robots, "robots-Meta sollte gesetzt sein").toBeTruthy();
    expect(robots).not.toMatch(/noindex/i);
    expect(robots).toMatch(/index/i);
  });

  test("rendert Article-JSON-LD", async ({ page }) => {
    await page.goto(articlePath);
    const scripts = await page
      .locator('script[type="application/ld+json"]')
      .allTextContents();

    const types = scripts.map((raw) => {
      try {
        return (JSON.parse(raw) as { "@type"?: string })["@type"];
      } catch {
        return undefined;
      }
    });
    expect(types).toContain("Article");
    expect(types).toContain("FAQPage");
  });
});

test.describe("SEO · OpenGraph-Meta", () => {
  test("Root-Layout setzt og:image, twitter:image, og:type=website", async ({
    page,
  }) => {
    await page.goto("/");

    const ogImage = await page
      .locator('head meta[property="og:image"]')
      .first()
      .getAttribute("content");
    expect(ogImage, "og:image meta sollte gesetzt sein").toBeTruthy();
    expect(ogImage).toMatch(/opengraph-image/);

    const twitterCard = await page
      .locator('head meta[name="twitter:card"]')
      .first()
      .getAttribute("content");
    expect(twitterCard).toBe("summary_large_image");

    const twitterImage = await page
      .locator('head meta[name="twitter:image"]')
      .first()
      .getAttribute("content");
    expect(twitterImage).toBeTruthy();

    const ogType = await page
      .locator('head meta[property="og:type"]')
      .first()
      .getAttribute("content");
    expect(ogType).toBe("website");
  });
});

test.describe("SEO · Schema.org Organization", () => {
  test("Root-Layout rendert Organization-JSON-LD", async ({ page }) => {
    await page.goto("/");

    const jsonLdRaw = await page
      .locator('head script[type="application/ld+json"]')
      .first()
      .textContent();

    expect(jsonLdRaw, "JSON-LD-Script sollte existieren").toBeTruthy();

    const parsed = JSON.parse(jsonLdRaw ?? "{}");
    expect(parsed["@type"]).toBe("Organization");
    expect(parsed.name).toBe("Tropfshop");
    expect(parsed.legalName).toBe("UFISO GmbH");
    expect(parsed.url).toMatch(/^https:\/\/tropfshop\.de/);
    expect(parsed.contactPoint).toBeInstanceOf(Array);
    expect(parsed.contactPoint[0].email).toMatch(/@tropfshop\.de$/);
  });
});

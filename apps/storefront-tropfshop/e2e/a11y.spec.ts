import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/**
 * a11y-Audit via axe-core (WCAG 2.1 A + AA).
 *
 * Akzeptanz Sprint 4:
 *  - 0 violations mit impact "critical" oder "serious"
 *  - Moderate/minor werden geloggt, schlagen aber nicht fehl
 *
 * Hintergrund: Wir bauen Tropfshop von Anfang an BFSG-konform (siehe
 * Vault 03-Recht-und-Compliance/BFSG-Accessibility.md und
 * 02-Architektur/Test-Strategie.md). axe-core fängt das Gros der
 * WCAG-Verstoesse automatisch ab — externe Pruefung (BIK) bleibt fuer
 * Phase 3.
 */

const AUDITED_ROUTES = [
  { path: "/", label: "Coming-Soon-Page" },
  { path: "/newsletter-bestaetigt", label: "Newsletter-Bestaetigt-Page" },
] as const;

for (const route of AUDITED_ROUTES) {
  test.describe(`a11y · ${route.label} (${route.path})`, () => {
    test("hat 0 critical und 0 serious Verstoesse (WCAG 2.1 A + AA)", async ({
      page,
    }) => {
      await page.goto(route.path);
      await page.waitForLoadState("networkidle");

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();

      const blocking = results.violations.filter(
        (v) => v.impact === "critical" || v.impact === "serious",
      );
      const warnings = results.violations.filter(
        (v) => v.impact === "moderate" || v.impact === "minor",
      );

      if (warnings.length > 0) {
        const summary = warnings
          .map((v) => `[${v.impact}] ${v.id}: ${v.help}`)
          .join("\n");
        console.warn(
          `[a11y · ${route.label}] ${warnings.length} non-blocking violations:\n${summary}`,
        );
      }

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
          `[a11y · ${route.label}] ${blocking.length} blocking violation(s):\n${details}`,
        );
      }

      expect(blocking).toHaveLength(0);
    });
  });
}

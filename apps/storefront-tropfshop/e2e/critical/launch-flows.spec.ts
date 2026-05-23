import { test } from "@playwright/test";

/**
 * PFLICHT-E2E-TESTS vor dem Public Launch (Vault: /goal, Test-Strategie).
 *
 * Diese Flows existieren noch nicht (kein Checkout in Phase 1). Sie sind
 * bewusst als `test.fixme` hinterlegt: in CI sichtbar als "pending", brechen
 * den Build aber nicht. Vor Launch je Flow ausimplementieren und fixme lösen.
 *
 * Sprint-5-Review (CI hat jetzt ein laufendes Backend): keiner der 4 Tests
 * kann nur durch CI-Backend aktiviert werden. Begruendung pro Test:
 *  1. Checkout/Stripe   — Cart-/Checkout-Flow + Stripe-Integration fehlen (Phase 2).
 *  2. Klarna            — B2C-Rechnungskauf-Adapter fehlt (Phase 2).
 *  3. B2B/Reverse-Charge — Customer-Auth + B2B-Gruppen + USt-ID-Validierung fehlen (Phase 2).
 *  4. CH-Versand        — CH-Region/CHF + Versandkosten-Engine + Zollhinweis fehlen (Phase 2).
 * Goal-Constraint Sprint 5: "Phase-2 Cart/Checkout/Auth bleiben fixme."
 *
 * Praktisch aktiviert wurde durch Sprint 5: der Coming-Soon-Tiles-E2E-Test
 * (e2e/coming-soon.spec.ts, "zeigt mindestens 4 Produkt-Tiles mit
 * 'Bald verfuegbar'-Badge") rennt jetzt gegen ein echtes Backend in CI, war
 * vorher rot (ComingSoonTiles degradierte auf null ohne Medusa-Verbindung).
 * Damit ist ein bisher de-facto-fixme-Test echt nutzbar geworden.
 */
test.describe("Launch-Critical Flows", () => {
  test.fixme(
    "Checkout Happy Path mit Stripe-Testkarte",
    async () => {
      // TODO: Warenkorb -> Checkout -> Stripe-Testkarte 4242… -> Bestellbestätigung
    },
  );

  test.fixme(
    "Klarna Rechnungskauf",
    async () => {
      // TODO: Checkout mit Klarna (B2C-Rechnungskauf) abschließen
    },
  );

  test.fixme(
    "B2B-Bestellung mit gültiger USt-IdNr. (Reverse-Charge, 0 % USt)",
    async () => {
      // TODO: B2B-Kundengruppe, USt-ID validieren, 0 % USt im Beleg prüfen
    },
  );

  test.fixme(
    "CH-Lieferadresse — korrekte Versandkosten + Zollhinweis",
    async () => {
      // TODO: Schweizer Lieferadresse -> CHF-Region, Versandkosten, Zollhinweis
    },
  );
});

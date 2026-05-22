import { test } from "@playwright/test";

/**
 * PFLICHT-E2E-TESTS vor dem Public Launch (Vault: /goal, Test-Strategie).
 *
 * Diese Flows existieren noch nicht (kein Checkout in Phase 1). Sie sind
 * bewusst als `test.fixme` hinterlegt: in CI sichtbar als "pending", brechen
 * den Build aber nicht. Vor Launch je Flow ausimplementieren und fixme lösen.
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

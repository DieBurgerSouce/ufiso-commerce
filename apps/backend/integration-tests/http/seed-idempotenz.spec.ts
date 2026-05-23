import { medusaIntegrationTestRunner } from "@medusajs/test-utils";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import seedFoundation from "../../src/scripts/seed";

jest.setTimeout(120 * 1000);

/**
 * Foundation-Seed muss idempotent sein:
 * Zweimaliger Lauf darf KEINE Duplikate erzeugen.
 *
 * Hintergrund: Sprint 2 hat aufgedeckt, dass der ursprueengliche Seed nur
 * Sales Channels deduplizieren konnte; Regionen, Stock Location, API Keys
 * usw. wurden bei Re-Run dupliziert (siehe 11-Daily-Notes/2026-05-23.md).
 *
 * Akzeptanzkriterium Sprint 3: nach 2x Seed-Lauf existiert genau ein
 * Eintrag pro Lookup-Key (Vault: 10-Checklisten/Wo-stehe-ich-gerade.md).
 */
medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ getContainer }) => {
    describe("Foundation-Seed Idempotenz", () => {
      it("erzeugt nach zweimaligem Lauf genau einen Eintrag pro Objekt", async () => {
        const container = getContainer();
        const noopLogger = {
          info: () => {},
          warn: () => {},
          error: () => {},
          debug: () => {},
          panic: () => {},
          shouldLog: () => false,
        };

        const originalLoggerResolve = container.resolve.bind(container);
        const wrappedContainer: typeof container = {
          ...container,
          resolve: (key: string) => {
            if (key === ContainerRegistrationKeys.LOGGER) {
              return noopLogger as any;
            }
            return originalLoggerResolve(key);
          },
        } as any;

        // Erster Seed-Lauf — erzeugt Foundation-Daten.
        await seedFoundation({
          container: wrappedContainer,
          args: [],
        } as any);

        // Zweiter Seed-Lauf — sollte alles ueberspringen.
        await seedFoundation({
          container: wrappedContainer,
          args: [],
        } as any);

        // ── Assert: genau 1 Eintrag pro Lookup-Key ───────────────────────────
        const salesChannelService = container.resolve(Modules.SALES_CHANNEL);
        const regionService = container.resolve(Modules.REGION);
        const taxService = container.resolve(Modules.TAX);
        const stockLocationService = container.resolve(Modules.STOCK_LOCATION);
        const fulfillmentService = container.resolve(Modules.FULFILLMENT);
        const apiKeyService = container.resolve(Modules.API_KEY);

        const channels = await salesChannelService.listSalesChannels({
          name: "tropfshop",
        });
        expect(channels).toHaveLength(1);

        const regionsDE = await regionService.listRegions({
          name: "Deutschland",
        });
        expect(regionsDE).toHaveLength(1);

        const regionsAT = await regionService.listRegions({
          name: "Österreich",
        });
        expect(regionsAT).toHaveLength(1);

        const taxRegionsDE = await taxService.listTaxRegions({
          country_code: "de",
        });
        expect(taxRegionsDE).toHaveLength(1);

        const taxRegionsAT = await taxService.listTaxRegions({
          country_code: "at",
        });
        expect(taxRegionsAT).toHaveLength(1);

        const stockLocations = await stockLocationService.listStockLocations({
          name: "Solingen Hauptlager",
        });
        expect(stockLocations).toHaveLength(1);

        const fulfillmentSets = await fulfillmentService.listFulfillmentSets({
          name: "Versand Solingen",
        });
        expect(fulfillmentSets).toHaveLength(1);

        const shippingProfiles =
          await fulfillmentService.listShippingProfiles({ type: "default" });
        expect(shippingProfiles).toHaveLength(1);

        const shippingOptions = await fulfillmentService.listShippingOptions({
          name: "Standardversand",
        });
        expect(shippingOptions).toHaveLength(1);

        const apiKeys = await apiKeyService.listApiKeys({
          title: "Tropfshop Storefront",
          type: "publishable",
        });
        expect(apiKeys).toHaveLength(1);
      });
    });
  },
});

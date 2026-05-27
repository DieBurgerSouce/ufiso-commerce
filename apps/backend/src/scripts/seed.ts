import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import {
  createApiKeysWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createShippingOptionsWorkflow,
  createShippingProfilesWorkflow,
  createStockLocationsWorkflow,
  createTaxRegionsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  updateStoresStep,
  updateStoresWorkflow,
} from "@medusajs/medusa/core-flows";
import { createComponentLogger } from "../lib/logger";

/**
 * UFISO / Tropfshop — Foundation-Seed (idempotent).
 *
 * Konfiguriert das Medusa-Backend gemaess Vault-SoT:
 *  - Sales Channel `tropfshop`          (02-Architektur/Medusa-Sales-Channels.md)
 *  - Regionen Deutschland + Oesterreich (EUR; USt 19 % / 20 %)
 *  - Stock Location "Solingen Hauptlager"
 *  - Fulfillment-Set "Versand Solingen" mit Service-Zone DACH (DE+AT)
 *  - Shipping Option "Standardversand"
 *  - Publishable API Key fuer das Storefront, gescoped auf `tropfshop`
 *
 * Bewusst NICHT geseedet: Produkte/Kategorien — der Katalog ist Odoo-getrieben
 * (ADR-003, packages/odoo-sync, Phase 1 spaeter).
 *
 * Idempotenz-Strategie: vor jeder Erstellung Lookup per stabilem Key. Wenn
 * vorhanden, ID wiederverwenden und "[seed] skip" loggen. Sprint 3 — vorher
 * war der Seed nur fuer Channels/Channel-Links idempotent (siehe
 * 11-Daily-Notes/2026-05-23.md "Erkannt").
 *
 * Lookup-Keys (eindeutige fachliche Identitaet pro Objekt):
 *   - Sales Channel           → name = "tropfshop"
 *   - Region                  → name = "Deutschland" | "Österreich"
 *   - Tax Region              → country_code = "de" | "at"
 *   - Stock Location          → name = "Solingen Hauptlager"
 *   - Fulfillment Profile     → type = "default"
 *   - Fulfillment Set         → name = "Versand Solingen"
 *   - Shipping Option         → name = "Standardversand" + Service-Zone
 *   - Publishable API Key     → title = "Tropfshop Storefront"
 *
 * Ausfuehren:  pnpm --filter @ufiso/backend seed
 */

const SALES_CHANNEL_NAME = "tropfshop";
const REGION_DE_NAME = "Deutschland";
const REGION_AT_NAME = "Österreich";
const STOCK_LOCATION_NAME = "Solingen Hauptlager";
const FULFILLMENT_SET_NAME = "Versand Solingen";
const SHIPPING_OPTION_NAME = "Standardversand";
const API_KEY_TITLE = "Tropfshop Storefront";
const FULFILLMENT_PROVIDER_ID = "manual_manual";

// ── Hofladen (Sprint 11 C.2, FUNKTIONALER Multi-Shop-Stresstest) ──────────
// Vault-Mantra Sprint 11: zweiter Brand beweist die Architektur funktional;
// KEIN visuelles Polishing, KEINE realen Lieferantennamen. Hofladen-Lager
// ist ein Mock-Standort, dient nur dazu, dass Channel ↔ Location ↔ API-Key
// fuer einen zweiten Shop existiert. Fulfillment-Set wird mit dem Tropfshop
// geteilt (DACH-Zone deckt beide Shops) — bewusst minimal, kein eigenes
// Versand-Setup pro Brand fuer Phase 1.
const HOFLADEN_CHANNEL_NAME = "hofladen";
const HOFLADEN_STOCK_LOCATION_NAME = "Hofladen-Lager";
const HOFLADEN_API_KEY_TITLE = "Hofladen Storefront";

const updateStoreCurrencies = createWorkflow(
  "update-store-currencies",
  (input: { store_id: string }) => {
    const normalized = transform({ input }, (data) => ({
      selector: { id: data.input.store_id },
      update: {
        supported_currencies: [{ currency_code: "eur", is_default: true }],
      },
    }));

    return new WorkflowResponse(updateStoresStep(normalized));
  }
);

export default async function seedFoundation({ container }: ExecArgs) {
  // Pino-Child statt Medusa-Container-Logger: strukturierte JSON-Logs in CI/Prod,
  // pino-pretty lokal, optional BetterStack-Transport. Container-Logger bleibt
  // fuer Medusa-Framework-Output unberuehrt (er wird hier nicht resolved).
  const logger = createComponentLogger("foundation-seed");
  const counts = { skip: 0, create: 0 };
  const skip = (object: string, id: string) => {
    counts.skip += 1;
    logger.info({ event: "seed.skip", object, id }, `[seed] skip: ${object} (id=${id})`);
  };
  const created = (object: string, id: string) => {
    counts.create += 1;
    logger.info({ event: "seed.create", object, id }, `[seed] create: ${object} (id=${id})`);
  };
  const link = container.resolve(ContainerRegistrationKeys.LINK);
  const fulfillmentModuleService = container.resolve(Modules.FULFILLMENT);
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL);
  const storeModuleService = container.resolve(Modules.STORE);
  const regionModuleService = container.resolve(Modules.REGION);
  const taxModuleService = container.resolve(Modules.TAX);
  const stockLocationModuleService = container.resolve(Modules.STOCK_LOCATION);
  const apiKeyModuleService = container.resolve(Modules.API_KEY);

  logger.info({ event: "seed.start" }, "Seeding UFISO foundation data (idempotent)...");
  const [store] = await storeModuleService.listStores();

  // ── Sales Channel: tropfshop ───────────────────────────────────────────────
  // Lookup-Key: name = "tropfshop"
  let [tropfshopChannel] = await salesChannelModuleService.listSalesChannels({
    name: SALES_CHANNEL_NAME,
  });

  if (tropfshopChannel) {
    skip("sales_channel", tropfshopChannel.id);
  } else {
    const { result } = await createSalesChannelsWorkflow(container).run({
      input: {
        salesChannelsData: [
          {
            name: SALES_CHANNEL_NAME,
            description: "Tropfbewässerung DACH — tropfshop.de/.at/.ch",
          },
        ],
      },
    });
    tropfshopChannel = result[0];
    created("sales_channel", tropfshopChannel.id);
  }

  // ── Store: Default-Waehrung EUR + Default Sales Channel ────────────────────
  // updateStores ist von Natur aus idempotent (setzt Felder).
  await updateStoreCurrencies(container).run({ input: { store_id: store.id } });
  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: { default_sales_channel_id: tropfshopChannel.id },
    },
  });

  // ── Regionen: Deutschland + Oesterreich ────────────────────────────────────
  // Lookup-Key: name (eindeutig pro Region)
  const existingRegions = await regionModuleService.listRegions({
    name: { $in: [REGION_DE_NAME, REGION_AT_NAME] },
  });
  const regionByName = new Map(existingRegions.map((r) => [r.name, r]));
  const regionsToCreate: Array<{
    name: string;
    currency_code: string;
    countries: string[];
    payment_providers: string[];
  }> = [];

  if (!regionByName.has(REGION_DE_NAME)) {
    regionsToCreate.push({
      name: REGION_DE_NAME,
      currency_code: "eur",
      countries: ["de"],
      payment_providers: ["pp_system_default"],
    });
  }
  if (!regionByName.has(REGION_AT_NAME)) {
    regionsToCreate.push({
      name: REGION_AT_NAME,
      currency_code: "eur",
      countries: ["at"],
      payment_providers: ["pp_system_default"],
    });
  }

  if (regionsToCreate.length > 0) {
    const { result: createdRegions } = await createRegionsWorkflow(container).run({
      input: { regions: regionsToCreate },
    });
    for (const r of createdRegions) {
      regionByName.set(r.name, r);
      created("region", r.id);
    }
  }
  for (const name of [REGION_DE_NAME, REGION_AT_NAME]) {
    const existed = existingRegions.find((r) => r.name === name);
    if (existed) {
      skip("region", existed.id);
    }
  }
  const regionDE = regionByName.get(REGION_DE_NAME)!;

  // ── Tax-Regionen: USt 19 % (DE) / 20 % (AT) ────────────────────────────────
  // Lookup-Key: country_code
  const existingTaxRegions = await taxModuleService.listTaxRegions({
    country_code: { $in: ["de", "at"] },
  });
  const taxByCountry = new Set(
    existingTaxRegions.map((tr) => tr.country_code),
  );
  const taxesToCreate: Array<{
    country_code: string;
    provider_id: string;
    default_tax_rate: { name: string; code: string; rate: number };
  }> = [];
  if (!taxByCountry.has("de")) {
    taxesToCreate.push({
      country_code: "de",
      provider_id: "tp_system",
      default_tax_rate: { name: "Umsatzsteuer", code: "DE-UST", rate: 19 },
    });
  }
  if (!taxByCountry.has("at")) {
    taxesToCreate.push({
      country_code: "at",
      provider_id: "tp_system",
      default_tax_rate: { name: "Umsatzsteuer", code: "AT-UST", rate: 20 },
    });
  }
  if (taxesToCreate.length > 0) {
    await createTaxRegionsWorkflow(container).run({ input: taxesToCreate });
    for (const t of taxesToCreate) {
      created("tax_region", t.country_code);
    }
  }
  for (const tr of existingTaxRegions) {
    skip("tax_region", tr.id);
  }

  // ── Stock Location: Solingen Hauptlager ────────────────────────────────────
  // Lookup-Key: name
  let [stockLocation] = await stockLocationModuleService.listStockLocations({
    name: STOCK_LOCATION_NAME,
  });
  if (stockLocation) {
    skip("stock_location", stockLocation.id);
  } else {
    const { result: createdLocations } = await createStockLocationsWorkflow(
      container,
    ).run({
      input: {
        locations: [
          {
            name: STOCK_LOCATION_NAME,
            address: { city: "Solingen", country_code: "DE", address_1: "" },
          },
        ],
      },
    });
    stockLocation = createdLocations[0];
    created("stock_location", stockLocation.id);
  }

  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: { default_location_id: stockLocation.id },
    },
  });

  // ── Link: Stock-Location ↔ Fulfillment-Provider ────────────────────────────
  // Idempotenz: vorhandene Verknuepfungen pruefen, sonst link.create.
  const existingProviderLinks = await link.list({
    [Modules.STOCK_LOCATION]: { stock_location_id: stockLocation.id },
    [Modules.FULFILLMENT]: { fulfillment_provider_id: FULFILLMENT_PROVIDER_ID },
  });
  if (existingProviderLinks.length === 0) {
    await link.create({
      [Modules.STOCK_LOCATION]: { stock_location_id: stockLocation.id },
      [Modules.FULFILLMENT]: { fulfillment_provider_id: FULFILLMENT_PROVIDER_ID },
    });
    created("link:stock_location↔fulfillment_provider", FULFILLMENT_PROVIDER_ID);
  } else {
    skip("link:stock_location↔fulfillment_provider", FULFILLMENT_PROVIDER_ID);
  }

  // ── Fulfillment: Shipping Profile ──────────────────────────────────────────
  // Lookup-Key: type = "default" (Medusa-Standardprofil)
  let [shippingProfile] = await fulfillmentModuleService.listShippingProfiles({
    type: "default",
  });
  if (shippingProfile) {
    skip("shipping_profile", shippingProfile.id);
  } else {
    const { result } = await createShippingProfilesWorkflow(container).run({
      input: { data: [{ name: "Standard", type: "default" }] },
    });
    shippingProfile = result[0];
    created("shipping_profile", shippingProfile.id);
  }

  // ── Fulfillment-Set "Versand Solingen" ─────────────────────────────────────
  // Lookup-Key: name
  let [fulfillmentSet] = await fulfillmentModuleService.listFulfillmentSets(
    { name: FULFILLMENT_SET_NAME },
    { relations: ["service_zones"] },
  );
  if (fulfillmentSet) {
    skip("fulfillment_set", fulfillmentSet.id);
  } else {
    fulfillmentSet = await fulfillmentModuleService.createFulfillmentSets({
      name: FULFILLMENT_SET_NAME,
      type: "shipping",
      service_zones: [
        {
          name: "DACH",
          geo_zones: [
            { country_code: "de", type: "country" },
            { country_code: "at", type: "country" },
          ],
        },
      ],
    });
    created("fulfillment_set", fulfillmentSet.id);
  }

  // ── Link: Stock-Location ↔ Fulfillment-Set ─────────────────────────────────
  const existingSetLinks = await link.list({
    [Modules.STOCK_LOCATION]: { stock_location_id: stockLocation.id },
    [Modules.FULFILLMENT]: { fulfillment_set_id: fulfillmentSet.id },
  });
  if (existingSetLinks.length === 0) {
    await link.create({
      [Modules.STOCK_LOCATION]: { stock_location_id: stockLocation.id },
      [Modules.FULFILLMENT]: { fulfillment_set_id: fulfillmentSet.id },
    });
    created("link:stock_location↔fulfillment_set", fulfillmentSet.id);
  } else {
    skip("link:stock_location↔fulfillment_set", fulfillmentSet.id);
  }

  // ── Shipping Option "Standardversand" ──────────────────────────────────────
  // Lookup-Key: name + service_zone der Fulfillment-Set
  const serviceZone = fulfillmentSet.service_zones[0];
  if (!serviceZone) {
    throw new Error(
      "Fulfillment-Set 'Versand Solingen' hat keine Service-Zone — seed corrupt.",
    );
  }
  const [existingShippingOption] =
    await fulfillmentModuleService.listShippingOptions({
      name: SHIPPING_OPTION_NAME,
      service_zone: { id: serviceZone.id },
    });
  if (existingShippingOption) {
    skip("shipping_option", existingShippingOption.id);
  } else {
    await createShippingOptionsWorkflow(container).run({
      input: [
        {
          name: SHIPPING_OPTION_NAME,
          price_type: "flat",
          provider_id: FULFILLMENT_PROVIDER_ID,
          service_zone_id: serviceZone.id,
          shipping_profile_id: shippingProfile.id,
          type: {
            label: "Standard",
            description: "Lieferung in 2–4 Werktagen.",
            code: "standard",
          },
          prices: [
            { currency_code: "eur", amount: 5.95 },
            { region_id: regionDE.id, amount: 5.95 },
          ],
          rules: [
            { attribute: "enabled_in_store", value: "true", operator: "eq" },
            { attribute: "is_return", value: "false", operator: "eq" },
          ],
        },
      ],
    });
    created("shipping_option", SHIPPING_OPTION_NAME);
  }

  // ── Link: Sales Channel ↔ Stock Location ───────────────────────────────────
  // Reihenfolge der Module-Keys ist signifikant: SALES_CHANNEL ist die
  // registrierende Seite (siehe @medusajs/core-flows
  // sales-channel/steps/associate-locations-with-channels.ts).
  const existingChannelLocLinks = await link.list({
    [Modules.SALES_CHANNEL]: { sales_channel_id: tropfshopChannel.id },
    [Modules.STOCK_LOCATION]: { stock_location_id: stockLocation.id },
  });
  if (existingChannelLocLinks.length === 0) {
    await linkSalesChannelsToStockLocationWorkflow(container).run({
      input: { id: stockLocation.id, add: [tropfshopChannel.id] },
    });
    created("link:sales_channel↔stock_location", tropfshopChannel.id);
  } else {
    skip("link:sales_channel↔stock_location", tropfshopChannel.id);
  }

  // ── Publishable API Key fuer das Storefront ────────────────────────────────
  // Lookup-Key: title + type
  let [apiKey] = await apiKeyModuleService.listApiKeys({
    title: API_KEY_TITLE,
    type: "publishable",
  });
  if (apiKey) {
    skip("api_key", apiKey.id);
  } else {
    const {
      result: [createdKey],
    } = await createApiKeysWorkflow(container).run({
      input: {
        api_keys: [
          { title: API_KEY_TITLE, type: "publishable", created_by: "" },
        ],
      },
    });
    apiKey = createdKey;
    created("api_key", apiKey.id);
  }

  // ── Link: API Key ↔ Sales Channel ──────────────────────────────────────────
  const existingKeyLinks = await link.list({
    [Modules.API_KEY]: { publishable_key_id: apiKey.id },
    [Modules.SALES_CHANNEL]: { sales_channel_id: tropfshopChannel.id },
  });
  if (existingKeyLinks.length === 0) {
    await linkSalesChannelsToApiKeyWorkflow(container).run({
      input: { id: apiKey.id, add: [tropfshopChannel.id] },
    });
    created("link:api_key↔sales_channel", apiKey.id);
  } else {
    skip("link:api_key↔sales_channel", apiKey.id);
  }

  // ── Hofladen-Channel + Stock-Location + API-Key (Sprint 11 C.2) ──────────
  // Sales Channel `hofladen` analog zu `tropfshop`. Sortiment-/Sourcing-
  // Entscheidung ist Vater-blockiert — der Seed legt nur die Infrastruktur
  // an, damit eine zweite Storefront-App den Channel adressieren kann.

  let [hofladenChannel] = await salesChannelModuleService.listSalesChannels({
    name: HOFLADEN_CHANNEL_NAME,
  });
  if (hofladenChannel) {
    skip("sales_channel", hofladenChannel.id);
  } else {
    const { result } = await createSalesChannelsWorkflow(container).run({
      input: {
        salesChannelsData: [
          {
            name: HOFLADEN_CHANNEL_NAME,
            description:
              "Hofladen DACH — Mock-Sortiment Sprint 11, Sourcing Vater-blockiert.",
          },
        ],
      },
    });
    hofladenChannel = result[0];
    created("sales_channel", hofladenChannel.id);
  }

  // Stock Location "Hofladen-Lager" (mock — eigener Standort fuer
  // saubere Multi-Shop-Trennung, real wird das beim Vater-Termin
  // entschieden).
  let [hofladenStockLocation] =
    await stockLocationModuleService.listStockLocations({
      name: HOFLADEN_STOCK_LOCATION_NAME,
    });
  if (hofladenStockLocation) {
    skip("stock_location", hofladenStockLocation.id);
  } else {
    const { result: createdLocations } = await createStockLocationsWorkflow(
      container,
    ).run({
      input: {
        locations: [
          {
            name: HOFLADEN_STOCK_LOCATION_NAME,
            address: { city: "Solingen", country_code: "DE", address_1: "" },
          },
        ],
      },
    });
    hofladenStockLocation = createdLocations[0];
    created("stock_location", hofladenStockLocation.id);
  }

  // Link: Hofladen-Lager ↔ Fulfillment-Provider (`manual_manual`,
  // analog zu Tropfshop — kein eigener Provider in Phase 1).
  const existingHofProviderLinks = await link.list({
    [Modules.STOCK_LOCATION]: { stock_location_id: hofladenStockLocation.id },
    [Modules.FULFILLMENT]: { fulfillment_provider_id: FULFILLMENT_PROVIDER_ID },
  });
  if (existingHofProviderLinks.length === 0) {
    await link.create({
      [Modules.STOCK_LOCATION]: { stock_location_id: hofladenStockLocation.id },
      [Modules.FULFILLMENT]: {
        fulfillment_provider_id: FULFILLMENT_PROVIDER_ID,
      },
    });
    created(
      "link:hofladen_stock_location↔fulfillment_provider",
      FULFILLMENT_PROVIDER_ID,
    );
  } else {
    skip(
      "link:hofladen_stock_location↔fulfillment_provider",
      FULFILLMENT_PROVIDER_ID,
    );
  }

  // Bewusst KEIN eigener Fulfillment-Set-Link fuer Hofladen-Lager in
  // Phase 1: der Medusa-Link-Layer setzt 1:1 zwischen einem Stock Location
  // und einem Fulfillment Set durch ("Cannot create multiple links between
  // 'stock_location' and 'fulfillment'", auch wenn die Postgres-Tabelle
  // selbst Multi-Location-fuer-ein-Set zuliesse). Phase 1 zeigt nur
  // Coming-Soon-Tiles — Cart/Checkout/Shipping kommt erst nach Vater-
  // Termin + Hetzner-Setup. Sobald Hofladen ein eigenes Sortiment +
  // eigene Versandlogik braucht, bekommt das Hofladen-Lager ein eigenes
  // Fulfillment-Set (z. B. "Versand Hofladen") mit Service-Zone-Subset.

  // Link: Hofladen Sales Channel ↔ Hofladen-Lager.
  const existingHofChannelLocLinks = await link.list({
    [Modules.SALES_CHANNEL]: { sales_channel_id: hofladenChannel.id },
    [Modules.STOCK_LOCATION]: { stock_location_id: hofladenStockLocation.id },
  });
  if (existingHofChannelLocLinks.length === 0) {
    await linkSalesChannelsToStockLocationWorkflow(container).run({
      input: { id: hofladenStockLocation.id, add: [hofladenChannel.id] },
    });
    created(
      "link:hofladen_sales_channel↔stock_location",
      hofladenChannel.id,
    );
  } else {
    skip("link:hofladen_sales_channel↔stock_location", hofladenChannel.id);
  }

  // Publishable API Key fuer das Hofladen-Storefront, eigene Identitaet
  // analog zur Tropfshop-Key.
  let [hofladenApiKey] = await apiKeyModuleService.listApiKeys({
    title: HOFLADEN_API_KEY_TITLE,
    type: "publishable",
  });
  if (hofladenApiKey) {
    skip("api_key", hofladenApiKey.id);
  } else {
    const {
      result: [createdKey],
    } = await createApiKeysWorkflow(container).run({
      input: {
        api_keys: [
          {
            title: HOFLADEN_API_KEY_TITLE,
            type: "publishable",
            created_by: "",
          },
        ],
      },
    });
    hofladenApiKey = createdKey;
    created("api_key", hofladenApiKey.id);
  }

  // Link: Hofladen API Key ↔ Hofladen Sales Channel.
  const existingHofKeyLinks = await link.list({
    [Modules.API_KEY]: { publishable_key_id: hofladenApiKey.id },
    [Modules.SALES_CHANNEL]: { sales_channel_id: hofladenChannel.id },
  });
  if (existingHofKeyLinks.length === 0) {
    await linkSalesChannelsToApiKeyWorkflow(container).run({
      input: { id: hofladenApiKey.id, add: [hofladenChannel.id] },
    });
    created("link:hofladen_api_key↔sales_channel", hofladenApiKey.id);
  } else {
    skip("link:hofladen_api_key↔sales_channel", hofladenApiKey.id);
  }

  // .seed-output.json — CI liest hier den Publishable Key und exportiert ihn
  // als NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY fuer den Storefront-Build.
  // Lokal wird die Datei mitgeschrieben, ist aber gitignored (apps/backend/.gitignore).
  //
  // Sprint 11 C.2: zusaetzlich `shops`-Block mit beiden Storefronts. Die
  // Top-Level-Felder (publishableKey/salesChannelId) bleiben fuer
  // Backward-Compat als Tropfshop-Alias erhalten — der CI-Step
  // "Publishable Key in $GITHUB_ENV exportieren" liest sie unveraendert.
  const outputPath = resolve(process.cwd(), ".seed-output.json");
  try {
    writeFileSync(
      outputPath,
      `${JSON.stringify(
        {
          publishableKey: apiKey.token,
          salesChannelId: tropfshopChannel.id,
          shops: {
            tropfshop: {
              publishableKey: apiKey.token,
              salesChannelId: tropfshopChannel.id,
              stockLocationId: stockLocation.id,
            },
            hofladen: {
              publishableKey: hofladenApiKey.token,
              salesChannelId: hofladenChannel.id,
              stockLocationId: hofladenStockLocation.id,
            },
          },
          generatedAt: new Date().toISOString(),
        },
        null,
        2,
      )}\n`,
    );
    logger.info({ event: "seed.output_written", path: outputPath }, `[seed] wrote ${outputPath}`);
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    logger.warn({ event: "seed.output_failed", reason }, `[seed] could not write .seed-output.json: ${reason}`);
  }

  logger.info(
    { event: "seed.complete", counts },
    `Foundation-Seed abgeschlossen (idempotent): ${counts.skip} skip, ${counts.create} create.`,
  );
}

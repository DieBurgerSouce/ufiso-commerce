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
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const link = container.resolve(ContainerRegistrationKeys.LINK);
  const fulfillmentModuleService = container.resolve(Modules.FULFILLMENT);
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL);
  const storeModuleService = container.resolve(Modules.STORE);
  const regionModuleService = container.resolve(Modules.REGION);
  const taxModuleService = container.resolve(Modules.TAX);
  const stockLocationModuleService = container.resolve(Modules.STOCK_LOCATION);
  const apiKeyModuleService = container.resolve(Modules.API_KEY);

  logger.info("Seeding UFISO foundation data (idempotent)...");
  const [store] = await storeModuleService.listStores();

  // ── Sales Channel: tropfshop ───────────────────────────────────────────────
  // Lookup-Key: name = "tropfshop"
  let [tropfshopChannel] = await salesChannelModuleService.listSalesChannels({
    name: SALES_CHANNEL_NAME,
  });

  if (tropfshopChannel) {
    logger.info(
      `[seed] skip: sales_channel "${SALES_CHANNEL_NAME}" (id=${tropfshopChannel.id})`,
    );
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
    logger.info(
      `[seed] create: sales_channel "${tropfshopChannel.name}" (id=${tropfshopChannel.id})`,
    );
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
    const { result: created } = await createRegionsWorkflow(container).run({
      input: { regions: regionsToCreate },
    });
    for (const r of created) {
      regionByName.set(r.name, r);
      logger.info(`[seed] create: region "${r.name}" (id=${r.id})`);
    }
  }
  for (const name of [REGION_DE_NAME, REGION_AT_NAME]) {
    const existed = existingRegions.find((r) => r.name === name);
    if (existed) {
      logger.info(`[seed] skip: region "${name}" (id=${existed.id})`);
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
      logger.info(`[seed] create: tax_region country=${t.country_code}`);
    }
  }
  for (const tr of existingTaxRegions) {
    logger.info(
      `[seed] skip: tax_region country=${tr.country_code} (id=${tr.id})`,
    );
  }

  // ── Stock Location: Solingen Hauptlager ────────────────────────────────────
  // Lookup-Key: name
  let [stockLocation] = await stockLocationModuleService.listStockLocations({
    name: STOCK_LOCATION_NAME,
  });
  if (stockLocation) {
    logger.info(
      `[seed] skip: stock_location "${STOCK_LOCATION_NAME}" (id=${stockLocation.id})`,
    );
  } else {
    const { result: created } = await createStockLocationsWorkflow(
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
    stockLocation = created[0];
    logger.info(
      `[seed] create: stock_location "${stockLocation.name}" (id=${stockLocation.id})`,
    );
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
    logger.info(
      `[seed] create: link stock_location ↔ fulfillment_provider (${FULFILLMENT_PROVIDER_ID})`,
    );
  } else {
    logger.info(
      `[seed] skip: link stock_location ↔ fulfillment_provider (${FULFILLMENT_PROVIDER_ID})`,
    );
  }

  // ── Fulfillment: Shipping Profile ──────────────────────────────────────────
  // Lookup-Key: type = "default" (Medusa-Standardprofil)
  let [shippingProfile] = await fulfillmentModuleService.listShippingProfiles({
    type: "default",
  });
  if (shippingProfile) {
    logger.info(
      `[seed] skip: shipping_profile type=default (id=${shippingProfile.id})`,
    );
  } else {
    const { result } = await createShippingProfilesWorkflow(container).run({
      input: { data: [{ name: "Standard", type: "default" }] },
    });
    shippingProfile = result[0];
    logger.info(
      `[seed] create: shipping_profile type=default (id=${shippingProfile.id})`,
    );
  }

  // ── Fulfillment-Set "Versand Solingen" ─────────────────────────────────────
  // Lookup-Key: name
  let [fulfillmentSet] = await fulfillmentModuleService.listFulfillmentSets(
    { name: FULFILLMENT_SET_NAME },
    { relations: ["service_zones"] },
  );
  if (fulfillmentSet) {
    logger.info(
      `[seed] skip: fulfillment_set "${FULFILLMENT_SET_NAME}" (id=${fulfillmentSet.id})`,
    );
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
    logger.info(
      `[seed] create: fulfillment_set "${fulfillmentSet.name}" (id=${fulfillmentSet.id})`,
    );
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
    logger.info(
      `[seed] create: link stock_location ↔ fulfillment_set (id=${fulfillmentSet.id})`,
    );
  } else {
    logger.info(
      `[seed] skip: link stock_location ↔ fulfillment_set (id=${fulfillmentSet.id})`,
    );
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
    logger.info(
      `[seed] skip: shipping_option "${SHIPPING_OPTION_NAME}" (id=${existingShippingOption.id})`,
    );
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
    logger.info(`[seed] create: shipping_option "${SHIPPING_OPTION_NAME}"`);
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
    logger.info(
      `[seed] create: link sales_channel ↔ stock_location`,
    );
  } else {
    logger.info(
      `[seed] skip: link sales_channel ↔ stock_location`,
    );
  }

  // ── Publishable API Key fuer das Storefront ────────────────────────────────
  // Lookup-Key: title + type
  let [apiKey] = await apiKeyModuleService.listApiKeys({
    title: API_KEY_TITLE,
    type: "publishable",
  });
  if (apiKey) {
    logger.info(`[seed] skip: api_key "${API_KEY_TITLE}" (id=${apiKey.id})`);
  } else {
    const {
      result: [created],
    } = await createApiKeysWorkflow(container).run({
      input: {
        api_keys: [
          { title: API_KEY_TITLE, type: "publishable", created_by: "" },
        ],
      },
    });
    apiKey = created;
    logger.info(`[seed] create: api_key "${API_KEY_TITLE}" (id=${apiKey.id})`);
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
    logger.info(`[seed] create: link api_key ↔ sales_channel`);
  } else {
    logger.info(`[seed] skip: link api_key ↔ sales_channel`);
  }

  // .seed-output.json — CI liest hier den Publishable Key und exportiert ihn
  // als NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY fuer den Storefront-Build.
  // Lokal wird die Datei mitgeschrieben, ist aber gitignored (apps/backend/.gitignore).
  const outputPath = resolve(process.cwd(), ".seed-output.json");
  try {
    writeFileSync(
      outputPath,
      `${JSON.stringify(
        {
          publishableKey: apiKey.token,
          salesChannelId: tropfshopChannel.id,
          generatedAt: new Date().toISOString(),
        },
        null,
        2,
      )}\n`,
    );
    logger.info(`[seed] wrote ${outputPath}`);
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    logger.warn(`[seed] could not write .seed-output.json: ${reason}`);
  }

  logger.info("──────────────────────────────────────────────");
  logger.info("Foundation-Seed abgeschlossen (idempotent).");
  logger.info(`Publishable API Key (-> Storefront .env.local):`);
  logger.info(`  NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=${apiKey.token}`);
  logger.info("──────────────────────────────────────────────");
}

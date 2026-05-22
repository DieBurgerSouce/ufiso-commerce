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
 * UFISO / Tropfshop — Foundation-Seed.
 *
 * Konfiguriert das Medusa-Backend gemaess Vault-SoT:
 *  - Sales Channel `tropfshop`          (02-Architektur/Medusa-Sales-Channels.md)
 *  - Regionen Deutschland + Oesterreich (EUR; USt 19 % / 20 %)
 *  - Stock Location "Solingen Hauptlager"
 *  - Publishable API Key fuer das Storefront, gescoped auf `tropfshop`
 *
 * Bewusst NICHT geseedet: Produkte/Kategorien — der Katalog ist Odoo-getrieben
 * (ADR-003, odoo-sync-Modul, Phase 1 spaeter).
 *
 * Ausfuehren:  pnpm --filter @ufiso/backend seed
 */

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

  logger.info("Seeding UFISO foundation data...");
  const [store] = await storeModuleService.listStores();

  // ── Sales Channel: tropfshop ───────────────────────────────────────────────
  let [tropfshopChannel] = await salesChannelModuleService.listSalesChannels({
    name: "tropfshop",
  });

  if (!tropfshopChannel) {
    const { result } = await createSalesChannelsWorkflow(container).run({
      input: {
        salesChannelsData: [
          {
            name: "tropfshop",
            description:
              "Tropfbewässerung DACH — tropfshop.de/.at/.ch",
          },
        ],
      },
    });
    tropfshopChannel = result[0];
  }
  logger.info(`Sales Channel: ${tropfshopChannel.name} (${tropfshopChannel.id})`);

  // ── Store: Default-Waehrung EUR + Default Sales Channel ────────────────────
  await updateStoreCurrencies(container).run({ input: { store_id: store.id } });
  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: { default_sales_channel_id: tropfshopChannel.id },
    },
  });

  // ── Regionen: Deutschland + Oesterreich ────────────────────────────────────
  const { result: regions } = await createRegionsWorkflow(container).run({
    input: {
      regions: [
        {
          name: "Deutschland",
          currency_code: "eur",
          countries: ["de"],
          payment_providers: ["pp_system_default"],
        },
        {
          name: "Österreich",
          currency_code: "eur",
          countries: ["at"],
          payment_providers: ["pp_system_default"],
        },
      ],
    },
  });
  const regionDE = regions[0];
  logger.info(`Regionen: ${regions.map((r) => r.name).join(", ")}`);

  // ── Tax-Regionen: USt 19 % (DE) / 20 % (AT) ────────────────────────────────
  await createTaxRegionsWorkflow(container).run({
    input: [
      {
        country_code: "de",
        provider_id: "tp_system",
        default_tax_rate: { name: "Umsatzsteuer", code: "DE-UST", rate: 19 },
      },
      {
        country_code: "at",
        provider_id: "tp_system",
        default_tax_rate: { name: "Umsatzsteuer", code: "AT-UST", rate: 20 },
      },
    ],
  });

  // ── Stock Location: Solingen Hauptlager ────────────────────────────────────
  const { result: stockLocations } = await createStockLocationsWorkflow(
    container
  ).run({
    input: {
      locations: [
        {
          name: "Solingen Hauptlager",
          address: { city: "Solingen", country_code: "DE", address_1: "" },
        },
      ],
    },
  });
  const stockLocation = stockLocations[0];

  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: { default_location_id: stockLocation.id },
    },
  });

  // Manual-Fulfillment-Provider an Location haengen
  await link.create({
    [Modules.STOCK_LOCATION]: { stock_location_id: stockLocation.id },
    [Modules.FULFILLMENT]: { fulfillment_provider_id: "manual_manual" },
  });

  // ── Fulfillment: Shipping Profile + Service-Zone DACH ──────────────────────
  let [shippingProfile] = await fulfillmentModuleService.listShippingProfiles({
    type: "default",
  });
  if (!shippingProfile) {
    const { result } = await createShippingProfilesWorkflow(container).run({
      input: { data: [{ name: "Standard", type: "default" }] },
    });
    shippingProfile = result[0];
  }

  const fulfillmentSet = await fulfillmentModuleService.createFulfillmentSets({
    name: "Versand Solingen",
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

  await link.create({
    [Modules.STOCK_LOCATION]: { stock_location_id: stockLocation.id },
    [Modules.FULFILLMENT]: { fulfillment_set_id: fulfillmentSet.id },
  });

  await createShippingOptionsWorkflow(container).run({
    input: [
      {
        name: "Standardversand",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: fulfillmentSet.service_zones[0].id,
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

  // ── Sales Channel <-> Stock Location verknuepfen ───────────────────────────
  await linkSalesChannelsToStockLocationWorkflow(container).run({
    input: { id: stockLocation.id, add: [tropfshopChannel.id] },
  });

  // ── Publishable API Key fuer das Storefront ────────────────────────────────
  const {
    result: [apiKey],
  } = await createApiKeysWorkflow(container).run({
    input: {
      api_keys: [
        { title: "Tropfshop Storefront", type: "publishable", created_by: "" },
      ],
    },
  });

  await linkSalesChannelsToApiKeyWorkflow(container).run({
    input: { id: apiKey.id, add: [tropfshopChannel.id] },
  });

  logger.info("──────────────────────────────────────────────");
  logger.info("Foundation-Seed abgeschlossen.");
  logger.info(`Publishable API Key (-> Storefront .env.local):`);
  logger.info(`  NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=${apiKey.token}`);
  logger.info("──────────────────────────────────────────────");
}

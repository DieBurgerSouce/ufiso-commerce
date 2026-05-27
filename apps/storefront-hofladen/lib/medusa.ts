import Medusa from "@medusajs/js-sdk";

/**
 * Singleton-Wrapper fuer das Medusa JS SDK (Hofladen-Storefront).
 *
 * Liest BACKEND_URL + PUBLISHABLE_KEY aus den ENV-Variablen
 * (siehe apps/storefront-hofladen/.env.local.template). Der Publishable
 * Key ist gescoped auf den Sales Channel `hofladen` — Eintrag
 * `shops.hofladen.publishableKey` in apps/backend/.seed-output.json.
 */

const baseUrl =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? "http://localhost:9000";
const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? "";

if (!publishableKey && process.env.NODE_ENV !== "test") {
  console.warn(
    "[medusa] NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ist leer — Storefront wird ohne Medusa-Daten rendern.",
  );
}

export const medusa = new Medusa({
  baseUrl,
  publishableKey,
  debug: process.env.NODE_ENV === "development",
});

export type MedusaClient = typeof medusa;

import Medusa from "@medusajs/js-sdk";

/**
 * Singleton-Wrapper fuer das Medusa JS SDK.
 *
 * Liest BACKEND_URL + PUBLISHABLE_KEY aus den ENV-Variablen
 * (siehe apps/storefront-tropfshop/.env.local.template). Beide sind
 * NEXT_PUBLIC_*, weil der Publishable Key per Definition oeffentlich ist
 * (gescoped auf den Sales Channel `tropfshop`, siehe Vault
 * 02-Architektur/Medusa-Sales-Channels.md).
 *
 * Erlaubt sowohl in Server Components als auch im Client-Bundle das gleiche
 * Modul zu importieren. Im Node-Modul-Cache ist die Instanz pro Process
 * effektiv ein Singleton.
 */

const baseUrl =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? "http://localhost:9000";
const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? "";

if (!publishableKey && process.env.NODE_ENV !== "test") {
  // Nur warnen, nicht werfen — die Coming-Soon-Seite muss auch ohne Backend
  // rendern (graceful degrade) (Vault: 02-Architektur/Test-Strategie.md).
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

import "server-only";
import { medusa } from "./medusa";

/**
 * Smoke-Check fuer die Medusa-Verbindung (Hofladen-Storefront).
 * Holt die Region-Liste, loggt das Ergebnis, blockiert kein Rendering.
 * Identische Semantik zur Tropfshop-Variante.
 */

let logged = false;

export async function pingMedusaConnection(): Promise<void> {
  if (logged) return;

  try {
    const { regions } = await medusa.store.region.list({ limit: 5 });
    logged = true;
    const names = regions.map((r) => `${r.name} (${r.currency_code})`).join(", ");
    console.info(
      `[medusa-smoke] Verbindung OK — ${regions.length} Region(en): ${names}`,
    );
  } catch (err) {
    logged = true;
    const reason = err instanceof Error ? err.message : String(err);
    console.warn(
      `[medusa-smoke] Verbindung fehlgeschlagen (Storefront rendert ohne Medusa-Daten weiter): ${reason}`,
    );
  }
}

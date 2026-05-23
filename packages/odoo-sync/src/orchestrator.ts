import type {
  Cents,
  LayerAAdapter,
  LayerBAdapter,
  Sku,
  SyncStockSnapshot,
} from "./types.js";

/**
 * Pure Functions, die Layer-A- und Layer-B-Adapter konsumieren.
 *
 * Bewusst seiteneffektfrei (ausser den Adapter-Calls): erleichtert
 * Tests gegen den MockAdapter und macht das Verhalten in Layer A
 * und Layer B identisch.
 *
 * Vault: 02-Architektur/Inventory-Modell-Odoo-Sync.md,
 *        03-Recht-und-Compliance/Verrechnungspreise.md.
 */

/** Untere Grenze des dokumentierten Markup-Korridors fuer Streckenware. */
export const MARKUP_PCT_MIN = 18;
/** Default-Markup bis Steuerberater-Termin (siehe Verrechnungspreise.md). */
export const MARKUP_PCT_DEFAULT = 20;
/** Obere Grenze des dokumentierten Markup-Korridors. */
export const MARKUP_PCT_MAX = 22;

/** Default-Sicherheitspuffer fuer Race-Condition-Schutz im Checkout. */
export const SAFETY_PCT_DEFAULT = 15;

/**
 * Wendet den Verrechnungspreis-Aufschlag auf den Quellsystem-EK an.
 *
 * Korridor: 18–22 % (Wiederverkaufspreismethode, dokumentiert in
 * 03-Recht-und-Compliance/Verrechnungspreise.md). Default 20 % gilt bis
 * Steuerberater-Termin den finalen Wert festsetzt
 * (08-Entscheidungen/Offene-Entscheidungen.md).
 *
 * Pure: liefert IMMER einen neuen Cents-Wert, mutiert nichts.
 *
 * @param basePriceCents Quellsystem-EK in cents (>= 0, integer).
 * @param brand Brand-Slug (z.B. "tropfshop"). Aktuell nur fuer Logging
 *   reserviert — brandspezifische Markups folgen, wenn der StB die
 *   Differenzierung freigibt.
 * @param markupPct Optional override, muss im Korridor 18..22 liegen,
 *   sonst Error. Default 20.
 * @returns Endkunden-Preis in cents, gerundet (Math.round).
 */
export function applyMarkup(
  basePriceCents: Cents,
  brand: string,
  markupPct: number = MARKUP_PCT_DEFAULT,
): Cents {
  if (!Number.isInteger(basePriceCents) || basePriceCents < 0) {
    throw new Error(
      `applyMarkup: basePriceCents muss ein nicht-negativer integer sein (got ${basePriceCents}).`,
    );
  }
  if (markupPct < MARKUP_PCT_MIN || markupPct > MARKUP_PCT_MAX) {
    throw new Error(
      `applyMarkup: markupPct ${markupPct} liegt ausserhalb des Korridors ` +
        `${MARKUP_PCT_MIN}..${MARKUP_PCT_MAX} (Verrechnungspreise.md).`,
    );
  }
  // brand bleibt vorerst Argument-Pflicht, damit Aufrufer den Kontext
  // explizit setzen — brandspezifische Markups folgen.
  void brand;
  return Math.round((basePriceCents * (100 + markupPct)) / 100);
}

/**
 * Reduziert die Quellsystem-Stueckzahl um einen Sicherheitspuffer
 * (Race-Condition-Schutz im Checkout, weil zwischen Layer-B-Lookup und
 * Order-Submit eine B2B-Bestellung in Spargelmesser dazwischengehen
 * koennte — siehe Inventory-Modell-Odoo-Sync.md "Edge Cases").
 *
 * Floor-Rundung, niemals negativ.
 *
 * @param sourceQty Roh-Stueckzahl im Quellsystem (>= 0).
 * @param safetyPct Puffer in % (0..100). Default 15.
 */
export function applySafetyBuffer(
  sourceQty: number,
  safetyPct: number = SAFETY_PCT_DEFAULT,
): number {
  if (sourceQty < 0) {
    throw new Error(
      `applySafetyBuffer: sourceQty muss >= 0 sein (got ${sourceQty}).`,
    );
  }
  if (safetyPct < 0 || safetyPct > 100) {
    throw new Error(
      `applySafetyBuffer: safetyPct ${safetyPct} muss in 0..100 liegen.`,
    );
  }
  return Math.floor(sourceQty * (1 - safetyPct / 100));
}

/**
 * Batch-Pull von Stock-Snapshots ueber einen Adapter (Layer A ODER B).
 *
 * Wirkt als duenne Pure-Function um den Adapter, damit der konsumierende
 * Code (zukuenftiger Medusa-Subscriber / Cron-Job) keine Adapter-Details
 * kennen muss.
 */
export async function syncStockBatch(
  adapter: LayerAAdapter | LayerBAdapter,
  skus: Sku[],
): Promise<SyncStockSnapshot[]> {
  if (skus.length === 0) {
    return [];
  }
  return adapter.pullStock(skus);
}

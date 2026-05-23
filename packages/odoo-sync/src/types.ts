/**
 * Sync-Datenmodell und Adapter-Interfaces fuer das 2-Layer-Sync-Modell
 * der UFISO-Architektur.
 *
 * Siehe Vault: 07-ADRs/ADR-007-Spargelmesser-UFISO-Integrationsmuster.md
 * und 02-Architektur/Inventory-Modell-Odoo-Sync.md.
 *
 * Architektur (vereinfacht):
 *
 *   Medusa  <----- Layer A -----> UFISO-Odoo  <----- Layer B -----> Spargelmesser
 *   (B2C)                         (eigene SoT)                       (Shopware Phase 1
 *                                                                    / Odoo Phase 2)
 *
 * Beide Layer haben **dieselbe Sync-Semantik** (pullStock, pushOrder,
 * pullCustomers) — die Adapter-Implementierung kapselt nur, welcher
 * Endpunkt angesprochen wird. Daher zwei Interfaces mit identischer
 * Signatur, aber semantisch unterschiedlichem Scope.
 *
 * Werte: Preise IMMER in cents (number, integer >= 0). Mengen als
 * dezimale number (Stueckzahlen oder Volumen). Currency ISO-4217
 * lowercase ("eur"). SKU als string, eindeutig pro Produkt-Variante.
 */

/** Preis in cents, integer, niemals negativ. */
export type Cents = number;

/** ISO-4217 currency code, lowercase. */
export type CurrencyCode = string;

/** Stable Stock-Keeping-Unit der UFISO-Produkt-Variante. */
export type Sku = string;

/** ─────────────────────────────────────────────────────────────────────
 *  Produkt-/Bestand-/Customer-/Order-Daten
 *  ───────────────────────────────────────────────────────────────────── */

/**
 * Produkt-Stammdatensatz, wie er aus dem Quellsystem (UFISO-Odoo bzw.
 * Spargelmesser) gepullt wird.
 *
 * `basePriceCents` ist der Quellsystem-EK (z.B. Spargelmesser-EK fuer
 * Streckenware). Der Markup wird vom Orchestrator angewendet
 * (siehe orchestrator.applyMarkup).
 */
export interface SyncProduct {
  sku: Sku;
  title: string;
  /** Quellsystem-Einkaufspreis in cents. Wird im Orchestrator multipliziert. */
  basePriceCents: Cents;
  currency: CurrencyCode;
  /** Optional: Brand, fuer brandspezifische Markup-Variationen. */
  brand?: string;
}

/**
 * Bestand-Snapshot pro SKU. `sourceQty` ist die rohe Stueckzahl im
 * Quellsystem. Der Orchestrator wendet einen Sicherheitspuffer an
 * (siehe orchestrator.applySafetyBuffer) und gibt dem konsumierenden
 * System (Medusa) die effektiv verfuegbare Menge.
 */
export interface SyncStockSnapshot {
  sku: Sku;
  sourceQty: number;
  effectiveAvailableQty: number;
  /** ISO-Zeitstempel, wann das Quellsystem den Stand zuletzt aktualisiert hat. */
  updatedAt: string;
}

/** Eine Position einer Order (Endkunde -> UFISO). */
export interface SyncOrderLine {
  sku: Sku;
  quantity: number;
  unitPriceCents: Cents;
  currency: CurrencyCode;
}

/** Order, die UFISO ans Quellsystem (Layer A) oder weiter (Layer B) schiebt. */
export interface SyncOrder {
  /** Eindeutige UFISO-Order-ID (Medusa Order ID oder UFISO-Odoo Sale-Order-Ref). */
  orderId: string;
  customerId: string;
  /** Brand-Slug (z.B. "tropfshop") — bestimmt Lieferschein-Branding. */
  brand: string;
  lines: SyncOrderLine[];
  totalCents: Cents;
  currency: CurrencyCode;
  /** ISO-Zeitstempel der Order-Erstellung im UFISO-System. */
  placedAt: string;
}

/** Customer-Datensatz (find-or-create im Ziel-Odoo). */
export interface SyncCustomer {
  /** Stabile UFISO-Customer-ID (Medusa Customer ID). */
  customerId: string;
  email: string;
  firstName: string;
  lastName: string;
  /** Optional: Letzte Aktualisierung im Quellsystem (fuer Delta-Pulls). */
  updatedAt?: string;
}

/** ─────────────────────────────────────────────────────────────────────
 *  Adapter-Interfaces (Layer A und Layer B)
 *
 *  Identische Signatur, anderer Scope:
 *    - Layer A: Medusa <-> UFISO-Odoo (eindeutiger Tech-Stack)
 *    - Layer B: UFISO-Odoo <-> Spargelmesser (Shopware Phase 1 / Odoo Phase 2)
 *
 *  Real-Implementierungen folgen nach UFISO-Odoo-Setup und Vater-Termin
 *  (ADR-007 Implementierung).
 *  ───────────────────────────────────────────────────────────────────── */

/**
 * Layer-A-Adapter: Brücke zwischen Medusa-Backend und UFISO-Odoo.
 *
 * Implementiert in Phase 2 als XML-RPC-Wrapper. Skeleton liefert nur den
 * In-Memory-Mock (siehe adapters/in-memory.ts).
 */
export interface LayerAAdapter {
  /**
   * Bestand fuer einen SKU-Batch aus UFISO-Odoo abfragen.
   * Reihenfolge im Ergebnis entspricht der Eingabe-Reihenfolge; unbekannte
   * SKUs werden weggelassen (kein null/undefined im Array).
   */
  pullStock(skus: Sku[]): Promise<SyncStockSnapshot[]>;

  /**
   * Endkunden-Order ans UFISO-Odoo pushen (sale.order anlegen).
   * Idempotent ueber orderId — wiederholtes Senden derselben Order
   * darf keine Duplikate erzeugen.
   */
  pushOrder(order: SyncOrder): Promise<void>;

  /**
   * Customer-Stammdaten aus UFISO-Odoo seit `updatedSince` ziehen
   * (Delta-Pull). Leerer ISO-String -> Voll-Pull.
   */
  pullCustomers(updatedSince: string): Promise<SyncCustomer[]>;
}

/**
 * Layer-B-Adapter: Brücke zwischen UFISO-Odoo und Spargelmesser-System.
 *
 * Phase 1: Spargelmesser-Shopware-Bridge (limitierte API-Tiefe, ggf. eigenes
 * Shopware-Plugin oder Middleware noetig — Aufwand-Klaerung im Vater-Termin).
 * Phase 2: Spargelmesser-Odoo-XML-RPC (deutlich einfacher als Shopware).
 *
 * Selbe Signatur wie LayerAAdapter, anderer Endpunkt.
 */
export interface LayerBAdapter {
  pullStock(skus: Sku[]): Promise<SyncStockSnapshot[]>;
  pushOrder(order: SyncOrder): Promise<void>;
  pullCustomers(updatedSince: string): Promise<SyncCustomer[]>;
}

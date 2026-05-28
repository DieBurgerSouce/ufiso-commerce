import type {
  LayerAAdapter,
  Sku,
  SyncCustomer,
  SyncOrder,
  SyncStockSnapshot,
} from "../types.js";

/**
 * Real-Layer-A-Adapter Skeleton fuer den UFISO-Odoo-XML-RPC-Endpoint.
 *
 * Verbindet das Medusa-Backend mit der UFISO-eigenen Odoo-Community-
 * Instanz (Hetzner-Coolify, Phase 2). Bis die Instanz live ist, laeuft
 * der Adapter rein gegen den `MockXmlRpcClient` — die echten Endpunkte
 * (`/xmlrpc/2/common`, `/xmlrpc/2/object`) werden in einem Folge-Sprint
 * eingehaengt, sobald der Vater-Termin den Odoo-Setup-Pfad geklaert hat
 * (siehe Vault `07-ADRs/ADR-007-Spargelmesser-UFISO-Integrationsmuster.md`).
 *
 * Architektur:
 *
 *   OdooXmlRpcAdapter
 *     ├── common  : XmlRpcClient   → /xmlrpc/2/common  (authenticate)
 *     └── object  : XmlRpcClient   → /xmlrpc/2/object  (execute_kw)
 *
 * Der `XmlRpcClient` ist absichtlich auf eine 1-Methode-Schnittstelle
 * reduziert (`call(method, params)`) — so kann der Production-Build
 * spaeter z. B. `@foxglove/xmlrpc` einhaengen, ohne dass der Adapter
 * davon weiss. Tests injizieren stattdessen den `MockXmlRpcClient` und
 * scripten Antworten deterministisch.
 *
 * Odoo-Semantik:
 *   - `authenticate(db, login, apikey, {})` -> uid (number) oder false.
 *   - `execute_kw(db, uid, apikey, model, method, args, kwargs)` -> beliebige Werte.
 *
 * Idempotenz: `pushOrder` setzt den Odoo-`client_order_ref` auf die
 * Medusa-`orderId`. Existiert bereits eine sale.order mit derselben
 * Referenz, wird der Push als no-op behandelt — Spargelmesser-Lager
 * darf NIEMALS doppelt pickseln.
 */

/**
 * Minimaler XML-RPC-Client-Vertrag. Genau eine Methode: `call`.
 * Production-Implementierungen wrappen damit z. B. `xmlrpc` oder
 * `@foxglove/xmlrpc`; Tests den `MockXmlRpcClient`.
 */
export interface XmlRpcClient {
  call<T>(method: string, params: unknown[]): Promise<T>;
}

export interface OdooXmlRpcConfig {
  /** Public URL der UFISO-Odoo-Instanz (informational, nur fuer Logs). */
  url: string;
  /** Odoo-DB-Name (z. B. "ufiso-prod"). */
  database: string;
  /** Odoo-Login-Username. */
  username: string;
  /** Odoo-API-Key (NICHT das User-Passwort; eigener Key in Odoo > Preferences). */
  apiKey: string;
}

/**
 * Scriptable Mock — wird in Tests an die Stelle eines echten
 * `xmlrpc`-Clients gehaengt. Jede Methode wird ueber einen Handler
 * im `handlers`-Object aufgeloest. Fehlt ein Handler, wirft `call`,
 * damit ungescriptete Aufrufe im Test sichtbar werden.
 */
export class MockXmlRpcClient implements XmlRpcClient {
  public readonly calls: Array<{ method: string; params: unknown[] }> = [];

  constructor(
    private readonly handlers: Record<string, (params: unknown[]) => unknown> = {},
  ) {}

  async call<T>(method: string, params: unknown[]): Promise<T> {
    this.calls.push({ method, params });
    const handler = this.handlers[method];
    if (!handler) {
      throw new Error(
        `MockXmlRpcClient: kein Handler fuer '${method}'. Gescripte: ${Object.keys(this.handlers).join(", ") || "(keine)"}.`,
      );
    }
    return handler(params) as T;
  }

  setHandler(method: string, handler: (params: unknown[]) => unknown): void {
    (this.handlers as Record<string, (params: unknown[]) => unknown>)[method] = handler;
  }
}

/**
 * Layer-A-Adapter, der gegen einen Odoo-XML-RPC-Endpoint spricht.
 *
 * Skeleton: die Method-Bodies bauen die Odoo-`execute_kw`-Aufrufe so
 * auf, wie die Real-Odoo sie spaeter erwartet, lassen sich aber im
 * Test deterministisch ueber den `MockXmlRpcClient` antworten.
 */
export class OdooXmlRpcAdapter implements LayerAAdapter {
  private uid: number | null = null;

  constructor(
    private readonly config: OdooXmlRpcConfig,
    private readonly common: XmlRpcClient,
    private readonly object: XmlRpcClient,
  ) {}

  /**
   * Authentifiziert gegen `/xmlrpc/2/common` und merkt sich die uid.
   * Wirft, wenn Odoo `false` zurueckgibt (falscher Login / API-Key).
   */
  async connect(): Promise<number> {
    const uid = await this.common.call<number | false>("authenticate", [
      this.config.database,
      this.config.username,
      this.config.apiKey,
      {},
    ]);
    if (!uid || typeof uid !== "number") {
      throw new Error(
        `OdooXmlRpcAdapter.connect: Authentication failed for db='${this.config.database}' user='${this.config.username}'.`,
      );
    }
    this.uid = uid;
    return uid;
  }

  /**
   * Stellt sicher, dass eine gueltige uid vorliegt; verbindet faul.
   */
  private async ensureConnected(): Promise<number> {
    if (this.uid !== null) return this.uid;
    return this.connect();
  }

  /**
   * Wrapper um `/xmlrpc/2/object.execute_kw`.
   */
  private async exec<T>(
    model: string,
    method: string,
    args: unknown[],
    kwargs: Record<string, unknown> = {},
  ): Promise<T> {
    const uid = await this.ensureConnected();
    return this.object.call<T>("execute_kw", [
      this.config.database,
      uid,
      this.config.apiKey,
      model,
      method,
      args,
      kwargs,
    ]);
  }

  async pullStock(skus: Sku[]): Promise<SyncStockSnapshot[]> {
    if (skus.length === 0) return [];

    // Odoo: product.product.search_read mit Domain default_code IN skus.
    // Felder: default_code (SKU), qty_available (Stueckzahl), write_date.
    type OdooProductRow = {
      default_code: Sku;
      qty_available: number;
      write_date: string;
    };
    const rows = await this.exec<OdooProductRow[]>(
      "product.product",
      "search_read",
      [[["default_code", "in", skus]]],
      { fields: ["default_code", "qty_available", "write_date"] },
    );

    // Reihenfolge bewahren, unbekannte SKUs weglassen
    // (siehe LayerAAdapter.pullStock-Vertrag).
    const bySku = new Map<Sku, OdooProductRow>();
    for (const row of rows) {
      bySku.set(row.default_code, row);
    }
    const result: SyncStockSnapshot[] = [];
    for (const sku of skus) {
      const row = bySku.get(sku);
      if (!row) continue;
      result.push({
        sku: row.default_code,
        sourceQty: row.qty_available,
        // Layer-A-Adapter liefert raw qty_available; der Sicherheits-
        // puffer wird im Orchestrator (`applySafetyBuffer`) angewendet,
        // damit Layer A und Layer B identisch testbar bleiben.
        effectiveAvailableQty: row.qty_available,
        updatedAt: row.write_date,
      });
    }
    return result;
  }

  async pushOrder(order: SyncOrder): Promise<void> {
    // Idempotenz: existiert eine sale.order mit client_order_ref == orderId,
    // wird der Push als no-op behandelt.
    const existing = await this.exec<number[]>(
      "sale.order",
      "search",
      [[["client_order_ref", "=", order.orderId]]],
      { limit: 1 },
    );
    if (existing.length > 0) return;

    const orderLines = order.lines.map((line) => [
      0,
      0,
      {
        product_id: line.sku, // Odoo erwartet Many2one ID — hier per default_code geloest in Realimpl
        product_uom_qty: line.quantity,
        price_unit: line.unitPriceCents / 100,
      },
    ]);

    await this.exec<number>(
      "sale.order",
      "create",
      [
        {
          client_order_ref: order.orderId,
          partner_id: order.customerId,
          x_brand: order.brand, // brand-Tag fuer Lieferschein-Branding
          date_order: order.placedAt,
          order_line: orderLines,
        },
      ],
    );
  }

  async pullCustomers(updatedSince: string): Promise<SyncCustomer[]> {
    type OdooCustomerRow = {
      id: number;
      email: string;
      firstname?: string;
      lastname?: string;
      write_date: string;
    };
    const domain =
      updatedSince === ""
        ? [["customer_rank", ">", 0]]
        : [
            ["customer_rank", ">", 0],
            ["write_date", ">=", updatedSince],
          ];
    const rows = await this.exec<OdooCustomerRow[]>(
      "res.partner",
      "search_read",
      [domain],
      { fields: ["id", "email", "firstname", "lastname", "write_date"] },
    );
    return rows.map((r) => ({
      customerId: String(r.id),
      email: r.email,
      firstName: r.firstname ?? "",
      lastName: r.lastname ?? "",
      updatedAt: r.write_date,
    }));
  }
}

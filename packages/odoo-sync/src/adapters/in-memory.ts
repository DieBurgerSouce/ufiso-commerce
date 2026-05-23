import type {
  LayerAAdapter,
  LayerBAdapter,
  Sku,
  SyncCustomer,
  SyncOrder,
  SyncProduct,
  SyncStockSnapshot,
} from "../types.js";

/**
 * In-Memory-Mock-Adapter fuer Tests und Local-Development.
 *
 * Implementiert BEIDE Layer-Interfaces (LayerAAdapter, LayerBAdapter)
 * mit derselben Map-basierten Implementierung. Im Prod-Setup wird das
 * durch echte XML-RPC- bzw. Shopware-Adapter ersetzt — die Tests gegen
 * den Orchestrator bleiben gleich.
 *
 * Idempotenz: pushOrder ueberschreibt einen vorhandenen Eintrag mit
 * derselben orderId (echte Adapter muessen sich identisch verhalten,
 * siehe types.ts LayerAAdapter.pushOrder).
 */
export class MockAdapter implements LayerAAdapter, LayerBAdapter {
  private readonly products = new Map<Sku, SyncProduct>();
  private readonly stockBySku = new Map<Sku, SyncStockSnapshot>();
  private readonly orders = new Map<string, SyncOrder>();
  private readonly customers = new Map<string, SyncCustomer>();

  async pullStock(skus: Sku[]): Promise<SyncStockSnapshot[]> {
    const result: SyncStockSnapshot[] = [];
    for (const sku of skus) {
      const snapshot = this.stockBySku.get(sku);
      if (snapshot) {
        result.push(snapshot);
      }
    }
    return result;
  }

  async pushOrder(order: SyncOrder): Promise<void> {
    // Idempotenz: gleicher orderId -> ueberschreibt.
    this.orders.set(order.orderId, order);
  }

  async pullCustomers(updatedSince: string): Promise<SyncCustomer[]> {
    if (updatedSince === "") {
      return Array.from(this.customers.values());
    }
    return Array.from(this.customers.values()).filter((c) => {
      if (!c.updatedAt) return false;
      return c.updatedAt >= updatedSince;
    });
  }

  // ── Test-Helper (nicht Teil des Adapter-Interfaces) ──────────────────────
  getOrder(orderId: string): SyncOrder | undefined {
    return this.orders.get(orderId);
  }

  listOrders(): SyncOrder[] {
    return Array.from(this.orders.values());
  }

  upsertCustomer(customer: SyncCustomer): void {
    this.customers.set(customer.customerId, customer);
  }

  upsertStock(snapshot: SyncStockSnapshot): void {
    this.stockBySku.set(snapshot.sku, snapshot);
  }

  upsertProduct(product: SyncProduct): void {
    this.products.set(product.sku, product);
  }

  getProduct(sku: Sku): SyncProduct | undefined {
    return this.products.get(sku);
  }
}

/**
 * Seed-Helper: legt eine Liste von Produkten + Default-Bestand
 * (sourceQty=100, effectiveAvailableQty=85 = 15 % Buffer angewendet)
 * im Mock an. Praktisch fuer Tests.
 */
export function seedMock(
  adapter: MockAdapter,
  products: SyncProduct[],
  defaultQty = 100,
  safetyPct = 15,
): void {
  const now = new Date().toISOString();
  const buffer = 1 - safetyPct / 100;
  for (const product of products) {
    adapter.upsertProduct(product);
    adapter.upsertStock({
      sku: product.sku,
      sourceQty: defaultQty,
      effectiveAvailableQty: Math.floor(defaultQty * buffer),
      updatedAt: now,
    });
  }
}

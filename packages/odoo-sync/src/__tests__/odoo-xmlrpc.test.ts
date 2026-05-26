import { describe, expect, it } from "vitest";
import {
  MockXmlRpcClient,
  OdooXmlRpcAdapter,
  type OdooXmlRpcConfig,
} from "../adapters/odoo-xmlrpc.js";
import { applyMarkup } from "../orchestrator.js";

const CONFIG: OdooXmlRpcConfig = {
  url: "https://odoo.ufiso.local",
  database: "ufiso-test",
  username: "ufiso-sync@ufiso.local",
  apiKey: "test-api-key",
};

function makeAdapter(opts: {
  common?: Record<string, (params: unknown[]) => unknown>;
  object?: Record<string, (params: unknown[]) => unknown>;
} = {}): {
  adapter: OdooXmlRpcAdapter;
  common: MockXmlRpcClient;
  object: MockXmlRpcClient;
} {
  const common = new MockXmlRpcClient({
    authenticate: () => 42,
    ...opts.common,
  });
  const object = new MockXmlRpcClient(opts.object ?? {});
  const adapter = new OdooXmlRpcAdapter(CONFIG, common, object);
  return { adapter, common, object };
}

describe("OdooXmlRpcAdapter.connect", () => {
  it("liefert die uid bei erfolgreicher Authentifizierung", async () => {
    const { adapter, common } = makeAdapter();
    const uid = await adapter.connect();
    expect(uid).toBe(42);
    expect(common.calls).toEqual([
      {
        method: "authenticate",
        params: ["ufiso-test", "ufiso-sync@ufiso.local", "test-api-key", {}],
      },
    ]);
  });

  it("wirft, wenn Odoo false zurueckgibt (falscher Key)", async () => {
    const { adapter } = makeAdapter({
      common: { authenticate: () => false },
    });
    await expect(adapter.connect()).rejects.toThrow(/Authentication failed/);
  });

  it("verbindet faul: erster pullStock triggert authenticate", async () => {
    const { adapter, common, object } = makeAdapter({
      object: { execute_kw: () => [] },
    });
    expect(common.calls).toHaveLength(0);
    await adapter.pullStock(["RIV-16-50"]);
    expect(common.calls).toHaveLength(1);
    expect(common.calls[0]!.method).toBe("authenticate");
    expect(object.calls[0]!.method).toBe("execute_kw");
  });

  it("ruft authenticate nur einmal bei mehreren Calls", async () => {
    const { adapter, common } = makeAdapter({
      object: { execute_kw: () => [] },
    });
    await adapter.pullStock(["A"]);
    await adapter.pullStock(["B"]);
    await adapter.pullStock(["C"]);
    expect(common.calls.filter((c) => c.method === "authenticate")).toHaveLength(1);
  });
});

describe("OdooXmlRpcAdapter.pullStock", () => {
  it("mapped Odoo-Rows auf SyncStockSnapshot in Eingabe-Reihenfolge", async () => {
    const { adapter } = makeAdapter({
      object: {
        execute_kw: () => [
          { default_code: "RIV-16-100", qty_available: 75, write_date: "2026-05-27 09:00:00" },
          { default_code: "RIV-16-50", qty_available: 120, write_date: "2026-05-27 09:00:00" },
        ],
      },
    });

    const result = await adapter.pullStock(["RIV-16-50", "RIV-16-100"]);

    expect(result).toEqual([
      {
        sku: "RIV-16-50",
        sourceQty: 120,
        effectiveAvailableQty: 120,
        updatedAt: "2026-05-27 09:00:00",
      },
      {
        sku: "RIV-16-100",
        sourceQty: 75,
        effectiveAvailableQty: 75,
        updatedAt: "2026-05-27 09:00:00",
      },
    ]);
  });

  it("unbekannte SKUs werden aus dem Ergebnis weggelassen", async () => {
    const { adapter } = makeAdapter({
      object: {
        execute_kw: () => [
          { default_code: "RIV-16-50", qty_available: 120, write_date: "2026-05-27 09:00:00" },
        ],
      },
    });
    const result = await adapter.pullStock(["RIV-16-50", "UNBEKANNT"]);
    expect(result.map((r) => r.sku)).toEqual(["RIV-16-50"]);
  });

  it("liefert leeres Array bei leerer SKU-Liste, ohne Odoo zu fragen", async () => {
    const { adapter, object, common } = makeAdapter({
      object: {
        execute_kw: () => {
          throw new Error("Odoo darf nicht angesprochen werden");
        },
      },
    });
    const result = await adapter.pullStock([]);
    expect(result).toEqual([]);
    expect(object.calls).toHaveLength(0);
    expect(common.calls).toHaveLength(0); // auch kein lazy connect
  });

  it("Layer-A liefert raw qty — Safety-Buffer kommt erst im Orchestrator", async () => {
    const { adapter } = makeAdapter({
      object: {
        execute_kw: () => [
          { default_code: "RIV-16-50", qty_available: 100, write_date: "2026-05-27" },
        ],
      },
    });
    const result = await adapter.pullStock(["RIV-16-50"]);
    expect(result[0]!.effectiveAvailableQty).toBe(100); // kein Buffer hier
  });
});

describe("OdooXmlRpcAdapter.pushOrder (Idempotenz)", () => {
  const sampleOrder = {
    orderId: "med_01H_TESTORDER",
    customerId: "501",
    brand: "tropfshop",
    lines: [{ sku: "RIV-16-50", quantity: 2, unitPriceCents: 4990, currency: "eur" }],
    totalCents: 9980,
    currency: "eur",
    placedAt: "2026-05-27T10:00:00Z",
  };

  it("legt eine neue sale.order an, wenn keine mit client_order_ref existiert", async () => {
    let createCalled = false;
    const { adapter, object } = makeAdapter({
      object: {
        execute_kw: (params: unknown[]) => {
          const [, , , , method] = params as [unknown, unknown, unknown, unknown, string];
          if (method === "search") return [];
          if (method === "create") {
            createCalled = true;
            return 999;
          }
          throw new Error(`Unerwartet: ${method}`);
        },
      },
    });
    await adapter.pushOrder(sampleOrder);
    expect(createCalled).toBe(true);
    // search + create
    expect(object.calls).toHaveLength(2);
  });

  it("skip, wenn bereits eine sale.order mit derselben orderId existiert", async () => {
    let createCalled = false;
    const { adapter, object } = makeAdapter({
      object: {
        execute_kw: (params: unknown[]) => {
          const [, , , , method] = params as [unknown, unknown, unknown, unknown, string];
          if (method === "search") return [777]; // existing order id
          if (method === "create") {
            createCalled = true;
            return 999;
          }
          throw new Error(`Unerwartet: ${method}`);
        },
      },
    });
    await adapter.pushOrder(sampleOrder);
    expect(createCalled).toBe(false);
    // nur search, kein create
    expect(object.calls).toHaveLength(1);
  });
});

describe("OdooXmlRpcAdapter.pullCustomers", () => {
  it("Voll-Pull bei leerem updatedSince (Domain ohne write_date)", async () => {
    let observedDomain: unknown;
    const { adapter } = makeAdapter({
      object: {
        execute_kw: (params: unknown[]) => {
          const args = (params as unknown[])[5] as unknown[][];
          observedDomain = args[0];
          return [];
        },
      },
    });
    await adapter.pullCustomers("");
    expect(observedDomain).toEqual([["customer_rank", ">", 0]]);
  });

  it("Delta-Pull mit write_date-Filter", async () => {
    let observedDomain: unknown;
    const { adapter } = makeAdapter({
      object: {
        execute_kw: (params: unknown[]) => {
          const args = (params as unknown[])[5] as unknown[][];
          observedDomain = args[0];
          return [];
        },
      },
    });
    await adapter.pullCustomers("2026-05-01 00:00:00");
    expect(observedDomain).toEqual([
      ["customer_rank", ">", 0],
      ["write_date", ">=", "2026-05-01 00:00:00"],
    ]);
  });

  it("mapped Odoo-Customer-Rows auf SyncCustomer", async () => {
    const { adapter } = makeAdapter({
      object: {
        execute_kw: () => [
          {
            id: 501,
            email: "kunde@beispiel.de",
            firstname: "Erika",
            lastname: "Mustermann",
            write_date: "2026-05-26 14:00:00",
          },
        ],
      },
    });
    const result = await adapter.pullCustomers("");
    expect(result).toEqual([
      {
        customerId: "501",
        email: "kunde@beispiel.de",
        firstName: "Erika",
        lastName: "Mustermann",
        updatedAt: "2026-05-26 14:00:00",
      },
    ]);
  });
});

describe("Integration: pullStock + applyMarkup", () => {
  it("pullt EK aus Layer A und liefert per applyMarkup den Endkunden-Preis", async () => {
    // Skeleton-Idee: Stock-Snapshot liefert nur Mengen — Preise kommen separat
    // (oder werden im Real-Adapter zusammen geliefert). Hier teste ich nur,
    // dass applyMarkup mit Layer-A-Daten kompatibel ist (Brand-Tag haendisch).
    const basePriceCents = 1999; // EK
    const result = applyMarkup(basePriceCents, "tropfshop", 20);
    expect(result).toBe(2399); // round(1999 * 1.20) = 2399
  });
});

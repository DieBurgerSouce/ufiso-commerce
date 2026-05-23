import { describe, expect, it } from "vitest";

import {
  applyMarkup,
  applySafetyBuffer,
  MARKUP_PCT_DEFAULT,
  MARKUP_PCT_MAX,
  MARKUP_PCT_MIN,
  SAFETY_PCT_DEFAULT,
  syncStockBatch,
} from "../orchestrator.js";
import { MockAdapter, seedMock } from "../adapters/in-memory.js";
import type { SyncOrder } from "../types.js";

describe("applyMarkup (Wiederverkaufspreismethode, Korridor 18..22%)", () => {
  it("liefert exakt +20 % bei Default-Markup (10,00 EUR -> 12,00 EUR)", () => {
    expect(applyMarkup(1000, "tropfshop")).toBe(1200);
    expect(applyMarkup(1000, "tropfshop", MARKUP_PCT_DEFAULT)).toBe(1200);
  });

  it("akzeptiert die Korridor-Untergrenze 18 %", () => {
    expect(applyMarkup(10000, "tropfshop", MARKUP_PCT_MIN)).toBe(11800);
  });

  it("akzeptiert die Korridor-Obergrenze 22 %", () => {
    expect(applyMarkup(10000, "tropfshop", MARKUP_PCT_MAX)).toBe(12200);
  });

  it("rundet kaufmaennisch auf den naechsten Cent (Math.round)", () => {
    // 333 cents * 1.20 = 399.6  -> 400
    expect(applyMarkup(333, "tropfshop")).toBe(400);
  });

  it("erhaelt 0-Eingang (currency-Erhalt-Sanity)", () => {
    expect(applyMarkup(0, "tropfshop")).toBe(0);
  });

  it("wirft bei Markup ausserhalb des Korridors", () => {
    expect(() => applyMarkup(1000, "tropfshop", 17.9)).toThrow(/Korridor/);
    expect(() => applyMarkup(1000, "tropfshop", 22.1)).toThrow(/Korridor/);
  });

  it("wirft bei negativem Basispreis", () => {
    expect(() => applyMarkup(-1, "tropfshop")).toThrow();
  });

  it("wirft bei nicht-integer Basispreis (verhindert Float-Schmutz)", () => {
    expect(() => applyMarkup(10.5, "tropfshop")).toThrow();
  });
});

describe("applySafetyBuffer (Race-Condition-Schutz Checkout)", () => {
  it("reduziert mit Default-15 % korrekt (100 -> 85)", () => {
    expect(applySafetyBuffer(100)).toBe(85);
    expect(applySafetyBuffer(100, SAFETY_PCT_DEFAULT)).toBe(85);
  });

  it("liefert 0 bei Quellbestand 0", () => {
    expect(applySafetyBuffer(0)).toBe(0);
  });

  it("liefert 0 bei 100 % Puffer (Worst-Case-Sperre)", () => {
    expect(applySafetyBuffer(50, 100)).toBe(0);
  });

  it("liefert Originalwert bei 0 % Puffer", () => {
    expect(applySafetyBuffer(73, 0)).toBe(73);
  });

  it("rundet immer ab (Math.floor) — niemals optimistisch", () => {
    // 7 * 0.85 = 5.95  -> floor 5
    expect(applySafetyBuffer(7)).toBe(5);
  });

  it("wirft bei negativem sourceQty", () => {
    expect(() => applySafetyBuffer(-1)).toThrow();
  });

  it("wirft bei safetyPct ausserhalb 0..100", () => {
    expect(() => applySafetyBuffer(100, -1)).toThrow();
    expect(() => applySafetyBuffer(100, 101)).toThrow();
  });
});

describe("MockAdapter (Layer-A/B-Roundtrip)", () => {
  it("pullStock liefert nur bekannte SKUs zurueck", async () => {
    const adapter = new MockAdapter();
    seedMock(adapter, [
      {
        sku: "SM-TRP-0001",
        title: "Rivulis Aries 16 mm",
        basePriceCents: 5000,
        currency: "eur",
      },
    ]);

    const result = await adapter.pullStock([
      "SM-TRP-0001",
      "DOES-NOT-EXIST",
    ]);
    expect(result).toHaveLength(1);
    expect(result[0]?.sku).toBe("SM-TRP-0001");
    expect(result[0]?.sourceQty).toBe(100);
    expect(result[0]?.effectiveAvailableQty).toBe(85);
  });

  it("pushOrder ist idempotent ueber orderId (Re-Send -> kein Duplikat)", async () => {
    const adapter = new MockAdapter();
    const order: SyncOrder = {
      orderId: "ord_001",
      customerId: "cust_001",
      brand: "tropfshop",
      lines: [
        { sku: "SM-TRP-0001", quantity: 2, unitPriceCents: 1200, currency: "eur" },
      ],
      totalCents: 2400,
      currency: "eur",
      placedAt: "2026-05-23T10:00:00.000Z",
    };

    await adapter.pushOrder(order);
    await adapter.pushOrder(order);

    expect(adapter.listOrders()).toHaveLength(1);
    expect(adapter.getOrder("ord_001")?.totalCents).toBe(2400);
  });

  it("pullCustomers liefert alle bei leerem updatedSince", async () => {
    const adapter = new MockAdapter();
    adapter.upsertCustomer({
      customerId: "cust_001",
      email: "a@example.com",
      firstName: "A",
      lastName: "Test",
      updatedAt: "2026-05-22T00:00:00.000Z",
    });
    adapter.upsertCustomer({
      customerId: "cust_002",
      email: "b@example.com",
      firstName: "B",
      lastName: "Test",
      updatedAt: "2026-05-23T00:00:00.000Z",
    });

    expect(await adapter.pullCustomers("")).toHaveLength(2);
  });

  it("pullCustomers filtert per updatedSince (Delta-Pull)", async () => {
    const adapter = new MockAdapter();
    adapter.upsertCustomer({
      customerId: "cust_001",
      email: "a@example.com",
      firstName: "A",
      lastName: "Test",
      updatedAt: "2026-05-22T00:00:00.000Z",
    });
    adapter.upsertCustomer({
      customerId: "cust_002",
      email: "b@example.com",
      firstName: "B",
      lastName: "Test",
      updatedAt: "2026-05-23T00:00:00.000Z",
    });

    const delta = await adapter.pullCustomers("2026-05-23T00:00:00.000Z");
    expect(delta).toHaveLength(1);
    expect(delta[0]?.customerId).toBe("cust_002");
  });
});

describe("syncStockBatch", () => {
  it("liefert leeres Array bei leerer SKU-Liste (kein Adapter-Call)", async () => {
    let called = false;
    const fakeAdapter = {
      pullStock: async () => {
        called = true;
        return [];
      },
      pushOrder: async () => {},
      pullCustomers: async () => [],
    };

    const result = await syncStockBatch(fakeAdapter, []);
    expect(result).toEqual([]);
    expect(called).toBe(false);
  });

  it("delegiert an Adapter und reicht Snapshots durch (happy path)", async () => {
    const adapter = new MockAdapter();
    seedMock(adapter, [
      {
        sku: "SM-TRP-0001",
        title: "Rivulis Aries",
        basePriceCents: 5000,
        currency: "eur",
      },
      {
        sku: "SM-TRP-0002",
        title: "Druckminderer",
        basePriceCents: 1500,
        currency: "eur",
      },
    ]);

    const result = await syncStockBatch(adapter, [
      "SM-TRP-0001",
      "SM-TRP-0002",
    ]);
    expect(result).toHaveLength(2);
    expect(result.map((s) => s.sku).sort()).toEqual([
      "SM-TRP-0001",
      "SM-TRP-0002",
    ]);
  });

  it("propagiert Adapter-Fehler (error path)", async () => {
    const failingAdapter = {
      pullStock: async () => {
        throw new Error("XML-RPC timeout");
      },
      pushOrder: async () => {},
      pullCustomers: async () => [],
    };

    await expect(syncStockBatch(failingAdapter, ["SM-TRP-0001"])).rejects.toThrow(
      "XML-RPC timeout",
    );
  });
});

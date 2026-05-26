import { expect, test } from "@playwright/test";

/**
 * ADR-014 Phase 2 — Rate-Limit fuer /api/log-client-error.
 *
 * 5 Reports / Minute / IP, sliding window. Request 6+ wird stiller 204
 * (kein Log, keine BetterStack-Weiterleitung). Die X-RateLimit-*-Header
 * sind RFC-9331-konform und machen das Verhalten fuer Clients +
 * automatisierte Tests beobachtbar; den HTTP-Statuscode aendert das
 * NICHT — von aussen sieht ein gedroppter Submit nach erfolgreicher
 * 204-Antwort aus.
 */
test.describe("rate-limit /api/log-client-error", () => {
  test("erlaubt 5 Submits pro Minute, droppt ab dem 6.", async ({ request }) => {
    const ip = "203.0.113.42"; // TEST-NET-3 (RFC 5737), pro Lauf eindeutig wirkenden Schluessel
    const remainingValues: number[] = [];

    for (let i = 0; i < 10; i++) {
      const res = await request.post("/api/log-client-error", {
        headers: {
          "Content-Type": "application/json",
          "X-Forwarded-For": ip,
        },
        data: {
          message: `e2e rate-limit probe #${i + 1}`,
          pathname: "/__test__/rate-limit",
        },
      });
      expect(res.status(), `Submit #${i + 1} muss 204 zurueckgeben`).toBe(204);

      const remaining = Number(res.headers()["x-ratelimit-remaining"]);
      remainingValues.push(remaining);
    }

    // Submits 1..5 zaehlen die Quote runter (4,3,2,1,0).
    expect(remainingValues.slice(0, 5)).toEqual([4, 3, 2, 1, 0]);
    // Submits 6..10 sind gedroppt — die Quote bleibt bei 0.
    expect(remainingValues.slice(5)).toEqual([0, 0, 0, 0, 0]);
  });
});

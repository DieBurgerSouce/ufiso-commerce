import { describe, expect, it } from "vitest";
import { buildKlaroConfig } from "../klaro-config-builder";
import { tropfshopKlaroConfig } from "../tropfshop/klaro";
import { demoshopKlaroConfig } from "../demoshop/klaro";

/**
 * Multi-Brand-Stress (Sprint 8) — der Builder muss fuer mindestens zwei
 * konkrete `ShopKlaroConfig`-Instanzen sauber bauen, und die brand-
 * eigentuemlichen Felder duerfen sich nicht ueber Shops vermischen.
 *
 * Was hier explizit NICHT geprueft wird:
 *  - DOM-Verhalten von Klaro (das macht `e2e/consent.spec.ts`).
 *  - Texte/Beschreibungen — die wandern oft, ohne dass das Pattern bricht.
 *  - Klaro-Library-Internals (Version, `injectStyles`, ...).
 *
 * Wenn dieser Test rot wird: erstens checken, ob ein Brand-Modul
 * `cookieName` aenderte oder einen Service entfernte — beides wuerde
 * Konsens-Daten von Bestandsnutzern unbrauchbar machen.
 */

describe("buildKlaroConfig — Multi-Brand", () => {
  it("baut die Tropfshop-Config ohne Fehler und behaelt den Brand-Cookie-Namen", () => {
    const native = buildKlaroConfig(tropfshopKlaroConfig);
    expect(native.cookieName).toBe("klaro-tropfshop");
  });

  it("baut die Demoshop-Mock-Config ohne Fehler und behaelt den Brand-Cookie-Namen", () => {
    const native = buildKlaroConfig(demoshopKlaroConfig);
    expect(native.cookieName).toBe("klaro-demoshop");
  });

  it("Cookie-Namen sind shop-eindeutig (keine Kollision auf shared domain)", () => {
    expect(tropfshopKlaroConfig.cookieName).not.toBe(
      demoshopKlaroConfig.cookieName,
    );
  });

  it("Tropfshop-Native: 2 Services (betterstack-telemetry + brevo-doi)", () => {
    const native = buildKlaroConfig(tropfshopKlaroConfig);
    expect(native.services).toHaveLength(2);
    expect(native.services.map((s) => s.name).sort()).toEqual([
      "betterstack-telemetry",
      "brevo-doi",
    ]);
  });

  it("Demoshop-Mock-Native: 1 Service (betterstack-telemetry)", () => {
    const native = buildKlaroConfig(demoshopKlaroConfig);
    expect(native.services).toHaveLength(1);
    expect(native.services.map((s) => s.name)).toEqual([
      "betterstack-telemetry",
    ]);
  });

  it("Default-Policy: alle Services Opt-in (default=false)", () => {
    for (const cfg of [tropfshopKlaroConfig, demoshopKlaroConfig]) {
      const native = buildKlaroConfig(cfg);
      for (const service of native.services) {
        expect(service.default).toBe(false);
      }
    }
  });

  it("Builder-Default: onlyOnce ist true (Phase-2-Stripe braucht expliziten Override)", () => {
    // Sprint-8-Hardening / consent.md "onlyOnce-Stolperstein". Verhindert,
    // dass ein versehentlicher Default-Wechsel Auto-Snippet-Services kaputt
    // macht. Sobald ein Service mit Auto-Loader (Stripe, Plausible) ins
    // Brand-Modul kommt, MUSS dieser Service `onlyOnce: false` explizit
    // tragen — der Test laesst die Default-Annahme bewusst stehen.
    const native = buildKlaroConfig(tropfshopKlaroConfig);
    for (const service of native.services) {
      expect(service.onlyOnce).toBe(true);
    }
  });
});

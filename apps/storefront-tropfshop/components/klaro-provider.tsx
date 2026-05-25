"use client";

import { useEffect } from "react";
import { tropfshopKlaroConfig } from "@ufiso/shop-config/tropfshop";
import type { KlaroManager, KlaroWatcherUpdate } from "klaro";
import {
  buildKlaroConfig,
  type KlaroNativeConfig,
} from "@/lib/klaro-config-builder";

/**
 * Klaro-Provider — laedt Klaro client-side, registriert die Brand-Config
 * und rendert das Banner. KEIN CDN: `klaro` ist als npm-Dependency gepinnt
 * (Version 0.7.21, siehe `package.json`). Die CSS-Datei kommt aus dem
 * gleichen Package und wird von Klaro selbst injiziert (kein externer
 * `<link>` noetig — `injectStyles()` in `klaro/src/lib.js`).
 *
 * SSR-safe via dynamischem `import("klaro")` in `useEffect`. Klaro greift
 * intern auf `window` zu — der dynamische Import garantiert, dass der
 * Module-Body nie server-side ausgewertet wird.
 *
 * Multi-Brand: Die Brand-Config kommt aus `@ufiso/shop-config/tropfshop`
 * und wird ueber `buildKlaroConfig` in Klaros internes Format uebersetzt.
 * Fuer einen zweiten Shop (Hofladen etc.) wird hier nur der Import auf das
 * andere Brand-Modul umgestellt — alle Texte/Services kommen aus dem
 * Brand-Modul.
 *
 * Side-Effects beim Mount:
 *  1. `klaro.setup(config)` — registriert Config und rendert das Banner,
 *     falls Consent noch nicht entschieden wurde.
 *  2. `manager.watch({...})` — bei jedem Update wird ein
 *     `klaro-consent-changed`-CustomEvent auf `window` dispatcht, damit
 *     `lib/consent.ts` re-evaluieren kann (Sprint-6-Hook).
 *  3. `window.__klaro` wird gesetzt, damit Footer/Datenschutz-Seite das
 *     Banner per Klick erneut oeffnen koennen.
 *
 * Aufraeumen: Klaro-Module bleiben fuer die Session geladen — kein
 * Teardown noetig. Watcher-Handler wird via `unwatch()` entfernt, falls
 * der Provider sich tatsaechlich unmounted (z. B. in Tests).
 */
export function KlaroProvider() {
  useEffect(() => {
    let cancelled = false;
    let unwatch: (() => void) | undefined;

    const config: KlaroNativeConfig = buildKlaroConfig(tropfshopKlaroConfig);

    import("klaro")
      .then((mod) => {
        if (cancelled) return;

        // Klaro 0.7 wird als UMD-Bundle ausgeliefert. Je nachdem, wie der
        // Bundler die CJS→ESM-Bruecke aufloest, liegen die Funktionen
        // entweder direkt auf dem Modul-Objekt oder unter `.default`.
        const klaro = (
          typeof (mod as { setup?: unknown }).setup === "function"
            ? mod
            : (mod as unknown as { default: typeof mod }).default
        ) as typeof mod;

        klaro.setup(config);

        const manager = klaro.getManager(config);

        const update: KlaroWatcherUpdate = (
          _manager: KlaroManager,
          eventType: string,
        ) => {
          if (
            eventType === "saveConsents" ||
            eventType === "applyConsents" ||
            eventType === "consents"
          ) {
            window.dispatchEvent(new CustomEvent("klaro-consent-changed"));
          }
        };
        const watcher = { update };
        manager.watch(watcher);
        unwatch = () => manager.unwatch?.(watcher);

        const klaroWindow = window as Window & {
          __klaro?: { show: () => void };
        };
        klaroWindow.__klaro = {
          show: () => {
            klaro.show(config);
          },
        };
      })
      .catch((err) => {
        // Klaro nicht ladbar: Banner fehlt, aber Seite laeuft weiter.
        // BetterStack erfaehrt davon nichts (lib/consent.ts gibt dann
        // standardmaessig `false` zurueck — Default-Deny bleibt).
        console.error("[klaro] setup failed", err);
      });

    return () => {
      cancelled = true;
      unwatch?.();
    };
  }, []);

  return null;
}

"use client";

import { useEffect } from "react";
import type { ShopKlaroConfig } from "@ufiso/shop-config/klaro-config";
import type { KlaroManager, KlaroWatcherUpdate } from "klaro";
import {
  buildKlaroConfig,
  type KlaroNativeConfig,
} from "@ufiso/shop-config/klaro-config-builder";

/**
 * Klaro-Provider Hofladen — strukturell identisch zur Tropfshop-Variante.
 * Brand-Config kommt als Prop, app/layout.tsx uebergibt hofladenKlaroConfig.
 *
 * Sprint-12-Kandidat: dieses Component in ein `@ufiso/klaro-provider`-
 * Package extrahieren, sobald > 2 Storefronts existieren — heute waere
 * das premature abstraction (Multi-Storefront-Layout.md).
 */
export function KlaroProvider({ config }: { config: ShopKlaroConfig }) {
  useEffect(() => {
    let cancelled = false;
    let unwatch: (() => void) | undefined;

    const nativeConfig: KlaroNativeConfig = buildKlaroConfig(config);

    import("klaro")
      .then((mod) => {
        if (cancelled) return;

        const klaro = (
          typeof (mod as { setup?: unknown }).setup === "function"
            ? mod
            : (mod as unknown as { default: typeof mod }).default
        ) as typeof mod;

        klaro.setup(nativeConfig);

        const manager = klaro.getManager(nativeConfig);

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
            klaro.show(nativeConfig);
          },
        };
      })
      .catch((err) => {
        console.error("[klaro] setup failed", err);
      });

    return () => {
      cancelled = true;
      unwatch?.();
    };
  }, [config]);

  return null;
}

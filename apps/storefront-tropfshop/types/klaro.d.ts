/**
 * Minimal-Typdefinitionen fuer das `klaro`-npm-Package (0.7.x).
 *
 * Klaro 0.7.21 liefert keine TypeScript-Definitionen mit. Wir typisieren
 * hier nur die Subset-API, die wir tatsaechlich benutzen — alles weitere
 * darf als `unknown` durchgereicht werden.
 */
declare module "klaro" {
  export interface KlaroManager {
    getConsent(serviceName: string): boolean;
    watch(watcher: { update: KlaroWatcherUpdate }): void;
    unwatch?(watcher: { update: KlaroWatcherUpdate }): void;
    confirmed: boolean;
  }

  export type KlaroWatcherUpdate = (
    manager: KlaroManager,
    eventType: string,
    data: unknown,
  ) => void;

  export function setup(config: unknown): void;
  export function show(config?: unknown, modal?: boolean, api?: unknown): void;
  export function getManager(config?: unknown): KlaroManager;
}

/**
 * Minimal-Typdefinitionen fuer das `klaro`-npm-Package (0.7.x).
 * Identisch zur Tropfshop-Typdefinition (Sprint 11 C.3 — bewusst dupliziert,
 * weil beide Apps unabhaengig builden; Refactor ins eigene Package
 * `@ufiso/klaro-types` ist Sprint-12-Kandidat).
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

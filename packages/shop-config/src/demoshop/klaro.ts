import type { ShopKlaroConfig } from "../klaro-config";

/**
 * Demoshop-Klaro-Konfiguration — Mock-Brand fuer Multi-Brand-Validierung
 * (Sprint 8). Dient als zweite konkrete Instanz von `ShopKlaroConfig`,
 * damit Builder + Provider gegen mehr als nur die Tropfshop-Datei testbar
 * sind. **KEIN realer Shop** und insbesondere **kein Hofladen** — der
 * Hofladen-Shop bleibt Vater-blockiert (Sortiment- + Streckengeschaeft-
 * Klaerung offen, siehe Vault: Wo-stehe-ich-gerade Blocker).
 *
 * Scope bewusst minimal:
 *  - 1 Service (`betterstack-telemetry`) — der Service, den jeder Shop
 *    sowieso braucht, damit Frontend-Telemetrie-Gate von Sprint 7
 *    weiterhin trifft.
 *  - 1 Purpose (`error-tracking`) — gleiche Kategorie wie Tropfshop.
 *  - Texte mit klarer Mock-Markierung, damit niemand die Datei mit einem
 *    Live-Shop verwechselt.
 *  - `cookieName="klaro-demoshop"` — eindeutig pro Shop, vermeidet
 *    Cookie-Kollision falls Shops sich Domains teilen
 *    (siehe `apps/docs/runbooks/consent.md` "Brand N+1 hinzufuegen").
 */
export const demoshopKlaroConfig: ShopKlaroConfig = {
  cookieName: "klaro-demoshop",
  privacyPolicyUrl: "/datenschutz",
  imprintUrl: "/impressum",
  purposes: [
    {
      id: "error-tracking",
      title: "Fehlerdiagnose (Mock)",
      description:
        "Mock-Demoshop: Wir erkennen technische Fehler im Browser, damit wir sie beheben koennen. Diese Brand-Datei ist nur Multi-Brand-Test, kein Live-Shop.",
    },
  ],
  services: [
    {
      name: "betterstack-telemetry",
      title: "Fehler-Telemetrie (Demoshop-Mock)",
      description:
        "Mock-Eintrag fuer Multi-Brand-Validierung. Verhalten + Cookie-Schreibweise sind identisch zur Tropfshop-Konfiguration.",
      purposes: ["error-tracking"],
      cookies: [],
      default: false,
      required: false,
    },
  ],
};

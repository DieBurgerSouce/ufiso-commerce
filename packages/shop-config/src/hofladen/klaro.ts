import type { ShopKlaroConfig } from "../klaro-config";

/**
 * Klaro-Konfiguration Hofladen (Sprint 11 C.1).
 *
 * Service-Liste **analog Tropfshop** (Goal): `betterstack-telemetry` +
 * `brevo-doi`. Default-Deny (Opt-in), gleiche Purpose-Kategorien.
 * Unterscheidet sich nur in:
 *  - `cookieName="klaro-hofladen"` — Shop-eindeutig, vermeidet Kollision
 *    mit Tropfshop/Demoshop bei Domain-Sharing (siehe Multi-Brand-Pattern).
 *  - Service-Beschreibungen sind generisch ("Hofladen") — KEINE echten
 *    Marken-/Lieferantennamen, weil das Sourcing Vater-blockiert ist
 *    ([[Lieferanten-UFISO-Brands-Brainstorm]] Hofladen-Stub).
 *
 * Brevo-Liste-ID kommt ueber die Storefront-ENV `BREVO_HOFLADEN_LIST_ID`,
 * nicht ueber die Klaro-Config (Klaro listet den Service nur, ohne API-
 * Konfiguration).
 */
export const hofladenKlaroConfig: ShopKlaroConfig = {
  cookieName: "klaro-hofladen",
  privacyPolicyUrl: "/datenschutz",
  imprintUrl: "/impressum",
  purposes: [
    {
      id: "error-tracking",
      title: "Fehlerdiagnose",
      description:
        "Wir erkennen technische Fehler im Browser (z. B. abgebrochene Seitenaufrufe), damit wir sie beheben koennen. Wir uebertragen dabei keine personenbezogenen Daten.",
    },
    {
      id: "marketing-doi",
      title: "Newsletter-Anmeldung",
      description:
        "Sie haben den Newsletter abonniert. Wir speichern Ihre E-Mail-Adresse beim Versanddienstleister Brevo, bis Sie sich abmelden.",
    },
  ],
  services: [
    {
      name: "betterstack-telemetry",
      title: "Fehler-Telemetrie (BetterStack)",
      description:
        "Sendet anonyme Fehlermeldungen aus Ihrem Browser an unser europaeisches Log-System (BetterStack, Frankfurt). Hilft uns, kaputte Seiten zu finden. Keine Cookies, keine personenbezogenen Daten.",
      purposes: ["error-tracking"],
      cookies: [],
      default: false,
      required: false,
    },
    {
      name: "brevo-doi",
      title: "Newsletter-Anmeldung (Brevo)",
      description:
        "Aktiv, sobald Sie sich zum Newsletter angemeldet haben. Brevo (EU-Server) speichert Ihre E-Mail-Adresse, bis Sie sich abmelden. Diese Einwilligung erteilen Sie aktiv im Newsletter-Formular — sie ist hier nur zur Uebersicht aufgefuehrt.",
      purposes: ["marketing-doi"],
      cookies: [],
      default: false,
      required: false,
    },
  ],
};

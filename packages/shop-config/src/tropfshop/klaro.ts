import type { ShopKlaroConfig } from "../klaro-config";

/**
 * Klaro-Konfiguration Tropfshop.
 *
 * Phase-1-Scope (Sprint 7, 2026-05-25):
 *  - `betterstack-telemetry` — Browser-Error-Telemetrie an BetterStack (Opt-in,
 *    DSGVO-Default-Deny). Konsumiert von `lib/consent.ts.hasErrorTrackingConsent()`
 *    und dort vom global-error-Reporter (POST /api/log-client-error) gelesen.
 *  - `brevo-doi` — Brevo-Newsletter-DOI. Wird NICHT vor User-Action geladen
 *    (kein Tracking-Snippet), Consent ist die explizite Submit-Aktion im
 *    Newsletter-Formular. Wird hier nur fuer Transparenz im Manager gelistet,
 *    damit Nutzer "Newsletter-Abmeldung + Cookie-Loeschung" an einer Stelle
 *    machen koennen.
 *
 * Bewusst NICHT enthalten (Phase-2-Kandidaten, vgl. ADR-013 + ADR-014):
 *  - Stripe — Checkout existiert in Phase 1 nicht. Wird Service mit
 *    `purpose=payment, required=true` (essential) sobald Cart kommt.
 *  - Plausible — derzeit kein Analytics-Setup. Falls Plausible EU-self-hosted
 *    kommt: Service `purpose=analytics`, `default=false`.
 */
export const tropfshopKlaroConfig: ShopKlaroConfig = {
  cookieName: "klaro-tropfshop",
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

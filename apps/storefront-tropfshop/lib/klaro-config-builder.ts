import type { ShopKlaroConfig } from "@ufiso/shop-config/klaro-config";

/**
 * Uebersetzt die brand-agnostische `ShopKlaroConfig` aus `@ufiso/shop-config`
 * in das von Klaro 0.7.x erwartete Format.
 *
 * Vorteile dieser Indirektion:
 *  - Brand-Module bleiben frei von Klaro-Internals (z. B. `version`,
 *    `storageMethod`, `noticeAsModal`).
 *  - Ein zweiter Shop liefert nur ein `ShopKlaroConfig`; der Builder kennt
 *    die Default-Policy (DSGVO-Default-Deny, BFSG-konforme Buttons).
 *
 * Policy-Defaults, die hier zentral gesetzt werden:
 *  - `mustConsent=false`        — keine Cookie-Wall (DSGVO + BFSG).
 *  - `hideDeclineAll=false`     — "Ablehnen" gleich prominent (DSK 2022).
 *  - `noticeAsModal=true`       — Banner als Modal, sichtbarer Fokus.
 *  - `htmlTexts=true`           — wir wollen Links in den Texten.
 *  - `acceptAll=true`           — "Alle akzeptieren" als sichtbarer Button.
 *  - `default=false`            — Opt-in fuer alles.
 *  - `lang="de"`                — Sie-Anrede, Deutsch only Phase 1.
 *  - `groupByPurpose=false`     — Phase 1 nur 2 Services, Gruppierung overkill.
 */
export type KlaroNativeConfig = ReturnType<typeof buildKlaroConfig>;

export function buildKlaroConfig(shopKlaroConfig: ShopKlaroConfig) {
  const { cookieName, privacyPolicyUrl, imprintUrl, purposes, services } =
    shopKlaroConfig;

  const purposesTranslation = Object.fromEntries(
    purposes.map((p) => [p.id, p.title]),
  );

  const serviceTranslations = Object.fromEntries(
    services.map((service) => [
      service.name,
      {
        title: service.title,
        description: service.description,
      },
    ]),
  );

  return {
    version: 1,
    elementID: "klaro",
    storageMethod: "cookie" as const,
    cookieName,
    cookieExpiresAfterDays: 365,

    default: false,
    mustConsent: false,
    acceptAll: true,
    hideDeclineAll: false,
    hideLearnMore: false,
    noticeAsModal: true,
    htmlTexts: true,

    lang: "de",
    groupByPurpose: false,

    translations: {
      de: {
        privacyPolicyUrl,
        consentModal: {
          title: "Einstellungen zum Datenschutz",
          description: buildModalDescription(privacyPolicyUrl, imprintUrl),
        },
        consentNotice: {
          title: "Datenschutz",
          description: buildNoticeDescription(privacyPolicyUrl, imprintUrl),
          changeDescription:
            "Es gibt aktualisierte Einstellungen, bitte bestaetigen Sie Ihre Auswahl erneut.",
          learnMore: "Einstellungen anpassen",
        },
        ok: "Alle akzeptieren",
        acceptAll: "Alle akzeptieren",
        acceptSelected: "Auswahl bestaetigen",
        decline: "Ablehnen",
        close: "Schliessen",
        save: "Speichern",
        poweredBy: "Realisiert mit Klaro!",
        privacyPolicy: {
          name: "Datenschutzerklaerung",
          text:
            "Mehr dazu in unserer {privacyPolicy}. Zum {imprint} geht es hier.",
        },
        purposes: purposesTranslation,
        purposeItem: {
          service: "Dienst",
          services: "Dienste",
        },
        service: {
          disableAll: {
            title: "Alle Dienste an- oder ausschalten",
            description:
              "Mit diesem Schalter aktivieren oder deaktivieren Sie alle optionalen Dienste auf einmal.",
          },
          optOut: {
            title: "(opt-out)",
            description:
              "Dieser Dienst ist standardmaessig aktiv (Sie koennen ihn ablehnen).",
          },
          required: {
            title: "(immer erforderlich)",
            description:
              "Dieser Dienst ist technisch erforderlich und kann nicht deaktiviert werden.",
          },
          purposes: "Zwecke",
          purpose: "Zweck",
        },
        ...serviceTranslations,
      },
    },

    services: services.map((service) => ({
      name: service.name,
      title: service.title,
      purposes: service.purposes,
      cookies: service.cookies ? [...service.cookies] : [],
      default: service.default,
      required: service.required ?? false,
      optOut: service.optOut ?? false,
      onlyOnce: service.onlyOnce ?? true,
    })),
  };
}

function buildModalDescription(privacyUrl: string, imprintUrl: string): string {
  return `
    <p>
      Wir nutzen optionale Dienste, um diese Seite stabil zu halten und Sie
      ueber den Start zu informieren. Sie entscheiden, welche aktiv sein
      duerfen. Ihre Auswahl koennen Sie jederzeit aendern.
    </p>
    <p>
      Details: <a href="${privacyUrl}">Datenschutzerklaerung</a> ·
      <a href="${imprintUrl}">Impressum</a>.
    </p>
  `.trim();
}

function buildNoticeDescription(
  privacyUrl: string,
  imprintUrl: string,
): string {
  return `
    Wir nutzen optionale Dienste, um diese Seite stabil zu halten und Sie
    ueber den Start zu informieren. Bitte waehlen Sie, was aktiv sein darf.
    Mehr in der <a href="${privacyUrl}">Datenschutzerklaerung</a>
    (<a href="${imprintUrl}">Impressum</a>).
  `.trim();
}

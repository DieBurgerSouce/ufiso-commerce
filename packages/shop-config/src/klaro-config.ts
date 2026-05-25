/**
 * Multi-Brand Klaro-Config — Typdefinitionen.
 *
 * Pro UFISO-Shop liefert das Brand-Modul (z. B. `tropfshop/klaro.ts`) einen
 * `ShopKlaroConfig`, der vom Storefront-`KlaroProvider` in das Klaro-eigene
 * Config-Objekt uebersetzt wird. Multi-Brand bleibt damit moeglich: jeder
 * Shop hat seine eigenen URLs, Services und Purposes, aber ein gemeinsames
 * Schema. Hinzufuegen eines neuen Shops = Anlegen einer Brand-Datei.
 *
 * Klaro-Doku: https://klaro.org/docs
 * Vault: 02-Architektur/Privacy-Stack.md (kommt mit Sprint 7).
 */

/**
 * Purpose-Kategorie (analog zu Klaro-`purposes`). Wird im Modal gruppiert,
 * wenn `groupByPurpose` aktiv ist (Default in unserem Setup: false, weil
 * wir Phase 1 nur zwei Services haben).
 */
export interface ShopKlaroPurpose {
  /** Stabile ID, z. B. "error-tracking". Wird in `service.purposes[]` referenziert. */
  id: string;
  /** Anzeigetitel, deutsch, Sie-Anrede. */
  title: string;
  /** Kurze Beschreibung der Kategorie. */
  description: string;
}

/**
 * Ein einzelner Dienst (Service in Klaro-Sprache). Default ist immer Opt-in
 * (`default=false`) — DSGVO-Default-Deny.
 */
export interface ShopKlaroService {
  /**
   * Eindeutiger Slug. Wird in `klaro.getManager().getConsent(name)` benutzt.
   * Beispiele: "betterstack-telemetry", "brevo-doi".
   */
  name: string;
  /** Anzeigetitel im Banner/Modal. */
  title: string;
  /** Erklaerung in einem Satz, Sie-Anrede. */
  description: string;
  /** Zugeordnete Purpose-IDs. Mindestens eine. */
  purposes: string[];
  /**
   * Cookies/Storage-Keys, die der Service setzt. Klaro raeumt diese bei
   * Consent-Entzug auf. Leer = keine clientseitigen Cookies (z. B. wenn der
   * Service serverseitig laeuft und nur Telemetrie sendet).
   */
  cookies?: ReadonlyArray<string | RegExp | [RegExp | string, string, string]>;
  /**
   * Default-State. `false` = Opt-in (DSGVO-Standard). `true` nur fuer
   * "essential"-Services, die zusaetzlich `required=true` setzen sollten.
   */
  default: boolean;
  /** Erforderlich (kann nicht deaktiviert werden). Nur fuer Essential-Services. */
  required?: boolean;
  /**
   * `optOut=true` laedt den Service VOR Consent. Wir setzen das nie auf
   * `true` — DSGVO-Default ist Opt-in. Feld bleibt nur dokumentationshalber.
   */
  optOut?: boolean;
  /**
   * `onlyOnce=true` fuehrt Side-Effects (z. B. Snippet-Inject) nur einmal
   * pro Toggle aus. Fuer unsere zwei Services egal (kein Auto-Snippet).
   */
  onlyOnce?: boolean;
}

/**
 * Komplette Klaro-Konfiguration pro Shop. Wird vom KlaroProvider in das
 * Klaro-Config-Format uebersetzt.
 */
export interface ShopKlaroConfig {
  /**
   * Eindeutiger Cookie-/Storage-Name pro Shop, damit Consent-State zwischen
   * Tropfshop/Hofladen/... nicht kollidiert. Format: "klaro-<shop-slug>".
   */
  cookieName: string;
  /**
   * Datenschutzerklaerung-URL. Klaro verlinkt diese im Banner.
   * Pfad-relative URLs sind erlaubt (z. B. "/datenschutz").
   */
  privacyPolicyUrl: string;
  /** Impressums-URL. Wird im Banner-Subtext verlinkt. */
  imprintUrl: string;
  /** Purposes (Kategorien). Mindestens eine. */
  purposes: ReadonlyArray<ShopKlaroPurpose>;
  /** Services. Mindestens einer. */
  services: ReadonlyArray<ShopKlaroService>;
}

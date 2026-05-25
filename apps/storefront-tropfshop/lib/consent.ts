/**
 * Klaro-Consent-Hook — angeschlossen an das echte Klaro-Manager-Objekt
 * (siehe `components/klaro-provider.tsx`).
 *
 * Diese Helper laufen ausschliesslich **client-side**. Server-side
 * (Edge/Route-Handler) gibt es kein Klaro-Cookie, das wir robust auswerten
 * koennten — die Telemetrie-Gate-Entscheidung trifft deshalb der Browser,
 * bevor er ueberhaupt einen POST absetzt. Die `/api/log-client-error`-Route
 * akzeptiert den POST dann ohne weitere Pruefung, weil:
 *  - Der Frontend-Reporter (siehe `app/global-error.tsx`) ruft `fetch` nur
 *    auf, wenn `hasErrorTrackingConsent() === true`.
 *  - Pino-Redact-Layer in `lib/logger.ts` redigiert PII auch dann zentral.
 *  - Ein Server-side Re-Check waere wirkungslos, weil das Cookie nur in der
 *    First-Party-Domain gesetzt wird und im POST nicht zwingend mitgesendet
 *    wird (kein Cookie-Header bei `keepalive`).
 */

const CONSENT_COOKIE_PATTERN = /^klaro-tropfshop=/;

/**
 * Darf Client-Error-Telemetrie an unseren Server gesendet und von dort an
 * BetterStack weitergeleitet werden?
 *
 * Liest **synchron** aus dem Klaro-Cookie. Damit funktioniert die Pruefung
 * auch, bevor das Klaro-Modul vollstaendig geladen ist (Klaro selbst laedt
 * asynchron via `dynamic import`, der Cookie ist aber sofort da, sobald
 * der User einmal entschieden hat).
 *
 * Default-Deny: vor erstem Consent-Save existiert kein Cookie → `false`.
 */
export function hasErrorTrackingConsent(): boolean {
  if (typeof window === "undefined") return false;
  return readKlaroConsent("betterstack-telemetry");
}

/**
 * Darf der Backend-Pino-Logger mit BetterStack-Transport schreiben?
 *
 * Server-side Logging ohne PII ist DSGVO-konform ueber berechtigtes
 * Interesse (Betriebssicherheit). Wir lassen den Helper drin, damit
 * symmetrisch zur Frontend-Welt geprueft werden kann — gibt aktuell
 * konstant `true` zurueck.
 */
export function hasServerLoggingConsent(): boolean {
  return true;
}

/**
 * Liest den Klaro-Consent fuer einen Service direkt aus dem Cookie.
 * Klaro schreibt einen URL-kodierten JSON-Blob unter `klaro-tropfshop`.
 *
 * Wir vermeiden bewusst den Umweg ueber `klaro.getManager()`, weil:
 *  - der Manager async geladen wird (Dynamic Import in `KlaroProvider`)
 *  - das Cookie die einzige Quelle ist, die auch ohne geladenes Klaro-Modul
 *    funktioniert (z. B. wenn der Bundle wegen Adblocker fehlt — Default
 *    bleibt dann sauber "kein Consent")
 */
function readKlaroConsent(serviceName: string): boolean {
  if (typeof document === "undefined") return false;

  const cookieEntry = document.cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => CONSENT_COOKIE_PATTERN.test(c));
  if (!cookieEntry) return false;

  const value = cookieEntry.slice(cookieEntry.indexOf("=") + 1);
  if (!value) return false;

  let parsed: unknown;
  try {
    parsed = JSON.parse(decodeURIComponent(value));
  } catch {
    return false;
  }

  if (!parsed || typeof parsed !== "object") return false;
  // Klaro 0.7.21 schreibt die Consent-Map flach: {"service": bool, ...}
  // (kein Wrapper-Objekt). Falls eine spaetere Version ein `consents`-Feld
  // einfuehrt, beruecksichtigen wir beide Layouts hier zentral.
  const candidate = parsed as Record<string, unknown> & {
    consents?: Record<string, boolean>;
  };
  if (candidate.consents && typeof candidate.consents === "object") {
    return candidate.consents[serviceName] === true;
  }
  return candidate[serviceName] === true;
}

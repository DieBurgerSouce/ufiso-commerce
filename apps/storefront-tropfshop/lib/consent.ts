/**
 * Klaro-Consent-Hook — STUB.
 *
 * Bis zum Klaro-Volleinbau-Sprint geben diese Helper hart `true` zurueck,
 * damit Error-Logging in der Pre-Launch-Phase funktioniert. Der DOI-Newsletter
 * und die Coming-Soon-Tiles sammeln keine PII ohne explizite User-Aktion;
 * Browser-Errors sind technisch und enthalten gemaess Redact-Strategie
 * (siehe [[Logging-Observability]]) keine personenbezogenen Daten.
 *
 * Sprint-7-Kandidat: Klaro-Volleinbau (Cookie-Banner, Service-Listen,
 * Consent-Persistenz, Re-Evaluation bei Aenderung). Dann werden diese
 * Helper an `klaro.getManager().getConsent("error-tracking")` etc.
 * angeschlossen.
 *
 * **NICHT** im Browser-Bundle:
 * - Server-Routes pruefen, ob ein Client das Consent-Cookie gesetzt hat
 *   (kommt mit Klaro). Bis dahin: always true.
 */

/**
 * Darf Client-Error-Telemetrie an unseren Server gesendet und von dort an
 * BetterStack weitergeleitet werden?
 */
export function hasErrorTrackingConsent(): boolean {
  // TODO(sprint-klaro): klaro.getManager().getConsent("error-tracking")
  return true;
}

/**
 * Darf der Backend-Pino-Logger mit BetterStack-Transport schreiben?
 * Server-side; hier nur fuer Symmetrie zur Frontend-Klaro-Welt.
 */
export function hasServerLoggingConsent(): boolean {
  // Server-side logging ohne PII ist DSGVO-konform ohne Consent (berechtigtes
  // Interesse / Betriebssicherheit). Stub returnt deshalb permanent true.
  return true;
}

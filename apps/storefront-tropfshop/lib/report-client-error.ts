import { hasErrorTrackingConsent } from "./consent";

/**
 * Sendet einen Client-Error an `/api/log-client-error`, gated durch das
 * Klaro-Consent fuer den Service `betterstack-telemetry`.
 *
 * Wird benutzt von:
 *  - `app/global-error.tsx` — Root-Render-Errors
 *  - `components/test-error-bridge.tsx` — Brueckenfunktion fuer E2E-Tests
 *    (haengt die gleiche Funktion an `window.__reportClientError`, sodass
 *    Playwright sie aufrufen kann, ohne den React-Render-Fehler-Mechanismus
 *    selbst zu triggern)
 *
 * Best-effort: Failure wird stiller Drop, damit der globale Error-Handler
 * nicht selbst zu einer Fehlerquelle wird.
 *
 * Format orientiert sich an dem, was die Route in `safe` zulaesst
 * (message/stack/digest/pathname).
 */
export interface ClientErrorReport {
  message?: string;
  stack?: string;
  digest?: string;
  pathname?: string;
}

export async function reportClientError(
  report: ClientErrorReport,
): Promise<void> {
  if (!hasErrorTrackingConsent()) return;

  const payload: ClientErrorReport = {
    message: report.message,
    stack: report.stack,
    digest: report.digest,
    pathname:
      report.pathname ??
      (typeof window !== "undefined" ? window.location.pathname : undefined),
  };

  try {
    await fetch("/api/log-client-error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch {
    // Stummschalten — kein Re-Throw.
  }
}

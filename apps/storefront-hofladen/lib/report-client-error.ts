import { hasErrorTrackingConsent } from "./consent";

/**
 * Sendet einen Client-Error an `/api/log-client-error`, gated durch
 * das Hofladen-Klaro-Consent (Cookie `klaro-hofladen`).
 * Identische API zur Tropfshop-Variante (Sprint 11 C.3, copy-then-strip).
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

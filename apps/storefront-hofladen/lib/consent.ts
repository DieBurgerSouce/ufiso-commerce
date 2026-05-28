/**
 * Klaro-Consent-Hook fuer Hofladen — analog zur Tropfshop-Variante, aber
 * mit eigenem Cookie-Pattern (`klaro-hofladen=`). Multi-Brand-Pattern
 * (Vault: 02-Architektur/Multi-Brand-Pattern.md): jeder Shop bekommt
 * einen eigenen Cookie, sonst kollidieren Consent-Entscheidungen auf
 * gemeinsamen Domains.
 */

const CONSENT_COOKIE_PATTERN = /^klaro-hofladen=/;

export function hasErrorTrackingConsent(): boolean {
  if (typeof window === "undefined") return false;
  return readKlaroConsent("betterstack-telemetry");
}

export function hasServerLoggingConsent(): boolean {
  return true;
}

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
  const candidate = parsed as Record<string, unknown> & {
    consents?: Record<string, boolean>;
  };
  if (candidate.consents && typeof candidate.consents === "object") {
    return candidate.consents[serviceName] === true;
  }
  return candidate[serviceName] === true;
}

import "server-only";
import { medusa } from "./medusa";

/**
 * Smoke-Check fuer die Medusa-Verbindung. Server-only, einmal pro Page-Render.
 *
 * Holt die Region-Liste (harmlos, immer vorhanden) und schreibt das Ergebnis
 * ins Server-Log. Bei Fehlern wird sauber zurueckgefallen — die Seite rendert
 * trotzdem, der Fehler wird nur geloggt. So bleibt der Smoke-Check unsichtbar
 * fuer den Endnutzer und blockiert kein Rendering, falls das Backend down ist.
 *
 * Wird in app/page.tsx aufgerufen (Server Component).
 */

let logged = false;

export async function pingMedusaConnection(): Promise<void> {
  if (logged) return; // pro Server-Prozess nur einmal loggen, sonst wird's spammy

  try {
    const { regions } = await medusa.store.region.list({ limit: 5 });
    logged = true;
    const names = regions.map((r) => `${r.name} (${r.currency_code})`).join(", ");
    console.info(
      `[medusa-smoke] Verbindung OK — ${regions.length} Region(en): ${names}`,
    );
  } catch (err) {
    logged = true;
    const reason = err instanceof Error ? err.message : String(err);
    console.warn(
      `[medusa-smoke] Verbindung fehlgeschlagen (Storefront rendert ohne Medusa-Daten weiter): ${reason}`,
    );
  }
}

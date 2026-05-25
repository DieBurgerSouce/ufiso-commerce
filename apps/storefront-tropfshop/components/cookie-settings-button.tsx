"use client";

/**
 * Cookie-Einstellungen-Button — oeffnet das Klaro-Banner manuell.
 *
 * Der `KlaroProvider` setzt nach `klaro.setup()` ein Helper-Objekt unter
 * `window.__klaro`. Dieser Button ruft dort die `show()`-Methode auf.
 * Falls Klaro noch nicht geladen ist (z. B. weil der User schneller klickt
 * als der dynamische Import zurueck ist), wird der Klick stiller Drop —
 * der naechste Klick funktioniert dann.
 *
 * Wird referenziert aus:
 *  - Footer (Coming-Soon-Page)
 *  - Datenschutz-Seite (Abschnitt "Cookies und Einwilligungen")
 */
export function CookieSettingsButton({
  variant = "link",
}: {
  variant?: "link" | "primary";
}) {
  const baseClasses =
    variant === "primary"
      ? "inline-flex items-center rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-neutral-950 transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-accent/50"
      : "underline underline-offset-2 hover:text-neutral-300";

  return (
    <button
      type="button"
      onClick={() => {
        const klaroWindow = window as Window & {
          __klaro?: { show: () => void };
        };
        klaroWindow.__klaro?.show();
      }}
      className={baseClasses}
    >
      Cookie-Einstellungen
    </button>
  );
}

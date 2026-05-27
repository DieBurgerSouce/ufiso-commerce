"use client";

/**
 * Cookie-Einstellungen-Button — oeffnet das Klaro-Banner manuell.
 * Identische Semantik zur Tropfshop-Variante; `window.__klaro` wird vom
 * Hofladen-KlaroProvider gesetzt (mit Hofladen-Cookie-Name).
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

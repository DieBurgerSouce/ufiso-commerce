"use client";

import { useEffect } from "react";
import { tropfshopBrand } from "@ufiso/shop-config/tropfshop";

/**
 * Global Error Boundary — faengt Render-Fehler im Root-Layout selbst ab.
 * Eigenes <html>/<body>, weil das Root-Layout im Fehlerfall NICHT greift.
 *
 * Bei Mount POSTet sie den Fehler nach /api/log-client-error (Server-Pino-
 * Logger -> BetterStack falls Token gesetzt). Klaro-Consent-Check passiert
 * server-side in der Route (siehe lib/consent.ts).
 *
 * Sprint-6-Stand: minimaler, brand-konformer Fallback. Cart/Checkout/Auth
 * kommen erst Phase 2 — bis dahin reicht "irgendwas geknallt, ladet die
 * Seite neu".
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    const payload = {
      message: error.message,
      stack: error.stack,
      digest: error.digest,
      pathname:
        typeof window !== "undefined" ? window.location.pathname : undefined,
    };

    // Best-effort POST. Failure ist kein Drama — der User sieht eh die
    // Fallback-UI, und wir wollen den globalen Error-Handler nicht
    // selbst zu einer Quelle weiterer Fehler machen.
    fetch("/api/log-client-error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {
      // Stummschalten — kein Re-Throw.
    });
  }, [error]);

  return (
    <html lang="de">
      <body
        style={{
          fontFamily:
            "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
          margin: 0,
          padding: "4rem 1.5rem",
          minHeight: "100vh",
          background: "#fafaf9",
          color: "#1c1917",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <main
          style={{
            maxWidth: "32rem",
            textAlign: "center",
          }}
        >
          <h1
            style={{
              fontSize: "1.875rem",
              fontWeight: 600,
              marginBottom: "1rem",
            }}
          >
            Da ist etwas schiefgegangen.
          </h1>
          <p style={{ fontSize: "1.0625rem", lineHeight: 1.6, marginBottom: "1.5rem" }}>
            Wir haben den Fehler protokolliert und schauen ihn uns an. Bitte
            laden Sie die Seite neu — meistens hilft das schon.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              cursor: "pointer",
              border: "none",
              borderRadius: "0.5rem",
              padding: "0.75rem 1.5rem",
              fontSize: "1rem",
              fontWeight: 500,
              background: "#1c1917",
              color: "white",
            }}
          >
            Seite neu laden
          </button>
          <p
            style={{
              marginTop: "2.5rem",
              fontSize: "0.875rem",
              color: "#78716c",
            }}
          >
            Wenn der Fehler bleibt, schreiben Sie uns kurz an{" "}
            <a
              href={`mailto:${tropfshopBrand.contact.email}`}
              style={{ color: "#1c1917" }}
            >
              {tropfshopBrand.contact.email}
            </a>
            .
          </p>
        </main>
      </body>
    </html>
  );
}

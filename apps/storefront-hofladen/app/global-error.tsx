"use client";

import { useEffect } from "react";
import { hofladenBrand } from "@ufiso/shop-config/hofladen";
import { reportClientError } from "@/lib/report-client-error";

/**
 * Global Error Boundary — faengt Render-Fehler im Root-Layout selbst ab.
 * Eigenes <html>/<body>, weil das Root-Layout im Fehlerfall NICHT greift.
 * Identische Semantik zur Tropfshop-Variante; Brand-Strings aus
 * hofladenBrand.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    void reportClientError({
      message: error.message,
      stack: error.stack,
      digest: error.digest,
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
          <p
            style={{
              fontSize: "1.0625rem",
              lineHeight: 1.6,
              marginBottom: "1.5rem",
            }}
          >
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
              href={`mailto:${hofladenBrand.contact.email}`}
              style={{ color: "#1c1917" }}
            >
              {hofladenBrand.contact.email}
            </a>
            .
          </p>
        </main>
      </body>
    </html>
  );
}

import { ImageResponse } from "next/og";
import { tropfshopBrand } from "@ufiso/shop-config/tropfshop";

/**
 * OG-Image fuer Social-Sharing (Facebook, LinkedIn, X/Twitter mit summary_large_image).
 *
 * Generiert per `next/og` `ImageResponse` zur Build/Request-Zeit. Vorteil
 * gegenueber einem statischen PNG: Brand-Aenderungen (Farben, Wordmark)
 * sind ein Code-Diff, kein Binary-Reimport. Sprint-4-Entscheidung
 * (Vault: 11-Daily-Notes/{HEUTE}).
 *
 * Naming-Konvention von Next 15 → die Datei wird automatisch als
 * `og:image` der gesamten App eingehaengt (siehe Layout). URL endet auf
 * `/opengraph-image`.
 */

// Dynamische Generierung zur Request-Zeit — Build-Pre-Rendering kollidiert
// mit Non-ASCII-Pfaden im Repo-Root (Bewässerung enthaelt ä, @vercel/og
// scheitert beim Static-Worker-Path-Resolve auf Windows).
export const dynamic = "force-dynamic";
export const alt = `${tropfshopBrand.name} — Tropfbewässerung für Garten und Klein-Gewerbe`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background: `linear-gradient(135deg, ${tropfshopBrand.colors.primary} 0%, ${tropfshopBrand.colors.neutral[900]} 55%, ${tropfshopBrand.colors.accent} 100%)`,
          color: tropfshopBrand.colors.neutral[50],
          fontFamily: tropfshopBrand.fonts.display,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "16px",
            fontSize: "28px",
            fontWeight: 500,
            opacity: 0.9,
          }}
        >
          <span
            style={{
              width: "14px",
              height: "14px",
              borderRadius: "9999px",
              background: tropfshopBrand.colors.accent,
            }}
          />
          Launch geplant für März 2027
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div
            style={{
              fontSize: "104px",
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: "-2px",
            }}
          >
            {tropfshopBrand.name}
          </div>
          <div
            style={{
              fontSize: "40px",
              fontWeight: 400,
              lineHeight: 1.3,
              maxWidth: "900px",
              color: tropfshopBrand.colors.neutral[200],
            }}
          >
            Der erste Spezialist-Shop für Tropfbewässerung in DACH.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "24px",
            color: tropfshopBrand.colors.neutral[300],
          }}
        >
          <span>{tropfshopBrand.domains.de}</span>
          <span>Versand aus Solingen · DE · AT</span>
        </div>
      </div>
    ),
    { ...size },
  );
}

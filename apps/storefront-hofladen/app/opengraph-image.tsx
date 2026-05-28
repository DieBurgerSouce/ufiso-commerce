import { ImageResponse } from "next/og";
import { hofladenBrand } from "@ufiso/shop-config/hofladen";

/**
 * OG-Image Hofladen — generisch, ohne realen Slogan oder Lieferantennamen
 * (Sprint 11 FUNKTIONALER Stresstest). Finale OG-Variante ist Sprint 12
 * nach Vater-Termin.
 */

export const dynamic = "force-dynamic";
export const alt = `${hofladenBrand.name} — regionale Lebensmittel`;
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
          background: `linear-gradient(135deg, ${hofladenBrand.colors.primary} 0%, ${hofladenBrand.colors.neutral[900]} 55%, ${hofladenBrand.colors.accent} 100%)`,
          color: hofladenBrand.colors.neutral[50],
          fontFamily: hofladenBrand.fonts.display,
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
              background: hofladenBrand.colors.accent,
            }}
          />
          Sortiment in Vorbereitung
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
            {hofladenBrand.name}
          </div>
          <div
            style={{
              fontSize: "40px",
              fontWeight: 400,
              lineHeight: 1.3,
              maxWidth: "900px",
              color: hofladenBrand.colors.neutral[200],
            }}
          >
            Regionale Lebensmittel — vom Hof in Ihren Haushalt.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "24px",
            color: hofladenBrand.colors.neutral[300],
          }}
        >
          <span>{hofladenBrand.domains.de}</span>
          <span>Pre-Launch · DE · AT</span>
        </div>
      </div>
    ),
    { ...size },
  );
}

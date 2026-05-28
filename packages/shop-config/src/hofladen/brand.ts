import type { BrandConfig } from "../types";

/**
 * Brand-Konfiguration Hofladen (Sprint 11 C.1 — FUNKTIONALER Multi-Shop-
 * Stresstest, NICHT visuelles Brand-Polishing).
 *
 * Mantra Sprint 11: "zweiter Brand beweist die Architektur FUNKTIONAL."
 * Hofladen wird mit generischen Mock-Werten gebaut — KEINE echten
 * Lieferanten-/Hofnamen, KEINE Sourcing-Entscheidung. Visuelles Brand-
 * Polishing (Hero-Images, Custom-Typography, Brand-Voice, final Colors)
 * ist Sprint 12, nach Vater-Termin.
 *
 * ACHTUNG — Vater-blockierte Posten (Vault: 08-Entscheidungen/Offene-Entscheidungen.md
 * + Lieferanten-UFISO-Brands-Brainstorm.md):
 *  - Endgueltiger Brand-Name + Slogan (Hofladen ist Arbeits-Slug).
 *  - Sortiments-Entscheidung (echte SKUs statt HOF-Mock-SKUs).
 *  - Domain (`hofladen.<tld>` ist Platzhalter, DPMA noch nicht recherchiert).
 *  - Logo/Favicon — Platzhalter bis Markenanmeldung.
 *
 * 1 CSS-Token-Wechsel gegen Tropfshop: `primary` von Wasserblau (#1e40af)
 * auf Erdbraun (#92400e). Damit sind Hofladen-Storefront-Hero/CTA visuell
 * sofort von Tropfshop unterscheidbar (Goal: "Brand-Name visuell sichtbar"
 * fuer den FUNKTIONALEN Stresstest, KEIN Polishing-Anspruch).
 */
export const hofladenBrand: BrandConfig = {
  slug: "hofladen",
  name: "Hofladen",
  legalName: "UFISO GmbH",
  domains: {
    // TBD — DPMA-Recherche + Domain-Registrierung sind Vater-blockiert.
    // Werte sind Platzhalter, nicht reserviert.
    de: "hofladen-shop.de",
    at: "hofladen-shop.at",
    ch: "hofladen-shop.ch",
  },
  colors: {
    // 1-CSS-Var-Wechsel gegen Tropfshop: Erdbraun statt Wasserblau,
    // analog Akzent. Finale Palette ist Sprint 12.
    primary: "#92400e",
    accent: "#a16207",
    neutral: {
      50: "#f8fafc",
      100: "#f1f5f9",
      200: "#e2e8f0",
      300: "#cbd5e1",
      400: "#94a3b8",
      500: "#64748b",
      600: "#475569",
      700: "#334155",
      800: "#1e293b",
      900: "#0f172a",
      950: "#020617",
    },
  },
  fonts: {
    display: "Inter",
    body: "Inter",
  },
  logo: {
    light: "/brand/hofladen/logo.svg",
    dark: "/brand/hofladen/logo-dark.svg",
    favicon: "/favicon.ico",
  },
  meta: {
    defaultTitle: "Hofladen — Regionale Lebensmittel (in Vorbereitung)",
    defaultDescription:
      "UFISO-Hofladen — regionale Lebensmittel, fair gehandelt. Sortiment + Liefergebiete werden noch finalisiert.",
    socialImage: "/brand/hofladen/og.jpg",
  },
  contact: {
    email: "service@hofladen-shop.de",
    phone: null,
  },
  social: {
    instagram: null,
    youtube: null,
    facebook: null,
  },
};

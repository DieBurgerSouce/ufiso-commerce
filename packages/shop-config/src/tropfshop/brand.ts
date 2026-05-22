import type { BrandConfig } from "../types";

/**
 * Brand-Konfiguration Tropfshop.
 *
 * ACHTUNG — offene Entscheidungen (Vault: 08-Entscheidungen/Offene-Entscheidungen.md):
 *  - Farbpalette (primary/accent) ist NICHT final ("Brand-Farben Tropfshop final").
 *  - Logo/Favicon sind Platzhalter bis Markenanmeldung (DPMA) geklaert ist.
 */
export const tropfshopBrand: BrandConfig = {
  slug: "tropfshop",
  name: "Tropfshop",
  legalName: "UFISO GmbH",
  domains: {
    de: "tropfshop.de",
    at: "tropfshop.at",
    ch: "tropfshop.ch",
  },
  colors: {
    // TBD — Wasserblau / Pflanzgruen, provisorische Werte aus Branding-Konfiguration.md
    primary: "#1e40af",
    accent: "#10b981",
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
    light: "/brand/tropfshop/logo.svg",
    dark: "/brand/tropfshop/logo-dark.svg",
    favicon: "/favicon.ico",
  },
  meta: {
    defaultTitle:
      "Tropfshop – Tropfbewässerung für Garten und Klein-Gewerbe",
    defaultDescription:
      "Der erste Spezialist-Shop für Tropfbewässerung in DACH. Technisch fundiert beraten, fair bepreist. Launch März 2027.",
    socialImage: "/brand/tropfshop/og.jpg",
  },
  contact: {
    email: "service@tropfshop.de",
    phone: null,
  },
  social: {
    instagram: "tropfshop.de",
    youtube: null,
    facebook: null,
  },
};

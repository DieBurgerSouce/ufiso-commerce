import type { MetadataRoute } from "next";
import { hofladenBrand } from "@ufiso/shop-config/hofladen";

/**
 * robots.txt — Phase 1 (Pre-Launch + Sprint-11-FUNKTIONALER-Stresstest).
 *
 * Hofladen ist explizit `Disallow: /` — der Stresstest validiert nur die
 * Architektur, der Shop selbst ist Vater-blockiert (Sortiment + Sourcing).
 * Datenschutz + Impressum bleiben erreichbar (TMG-Pflicht).
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = `https://${hofladenBrand.domains.de}`;
  return {
    rules: [
      {
        userAgent: "*",
        disallow: "/",
        allow: ["/datenschutz", "/impressum"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

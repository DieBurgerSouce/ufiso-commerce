import type { MetadataRoute } from "next";
import { tropfshopBrand } from "@ufiso/shop-config/tropfshop";

/**
 * robots.txt — Phase 1 (Pre-Launch).
 *
 * Global `Disallow: /` plus `noindex` in den Page-Metadaten (Startseite,
 * Produktbereich). AUSNAHME ab Sprint 12: der Ratgeber (`/ratgeber`) ist bereits
 * freigegeben — die Artikel sollen ueber die Monate bis Launch Suchmaschinen-
 * Autoritaet aufbauen (die Seiten setzen dafuer selbst `robots: index:true`).
 * Sitemap wird deklariert (enthaelt die indexierbaren Ratgeber-URLs).
 *
 * Vault: 05-Content-und-SEO/SEO-Strategie.md "Technical SEO".
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = `https://${tropfshopBrand.domains.de}`;
  return {
    rules: [
      {
        userAgent: "*",
        // Phase-1-Default: nichts indexieren.
        disallow: "/",
        // Ausnahmen:
        // - Datenschutz/Impressum: Pflichtseiten (Telemediengesetz), muessen
        //   auch in der Pre-Launch-Phase auffindbar sein.
        // - /ratgeber: Content-SEO-Aufbau ab Sprint 12 (indexierbar).
        allow: ["/datenschutz", "/impressum", "/ratgeber"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

import type { MetadataRoute } from "next";
import { tropfshopBrand } from "@ufiso/shop-config/tropfshop";

/**
 * robots.txt — Phase 1 (Pre-Launch).
 *
 * Wir sind noch nicht im Index — global `Disallow: /` plus `noindex` in
 * den Page-Metadaten (siehe app/layout.tsx + newsletter-bestaetigt/page.tsx).
 * Sitemap wird trotzdem deklariert, damit Crawler sie kennen, sobald wir auf
 * Phase 2 (Index-Freigabe ab März 2027) umstellen.
 *
 * Vault: 05-Content-und-SEO/SEO-Strategie.md "Technical SEO".
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = `https://${tropfshopBrand.domains.de}`;
  return {
    rules: [
      {
        userAgent: "*",
        disallow: "/",
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

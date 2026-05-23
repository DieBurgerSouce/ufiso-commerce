import type { MetadataRoute } from "next";
import { tropfshopBrand } from "@ufiso/shop-config/tropfshop";

/**
 * sitemap.xml — Phase 1.
 *
 * Enthaelt aktuell nur die Pre-Launch-Page und die DOI-Bestaetigungs-Page.
 * Letztere ist per Page-Metadata `noindex`, bleibt aber in der Sitemap,
 * damit Crawler ihre Existenz kennen — wir wollen verhindern, dass sie
 * spaeter als "Soft-404" eingestuft wird, sobald wir noindex zurueckziehen.
 *
 * Vault: 05-Content-und-SEO/SEO-Strategie.md "Technical SEO".
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = `https://${tropfshopBrand.domains.de}`;
  const lastModified = new Date();

  return [
    {
      url: `${baseUrl}/`,
      lastModified,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/newsletter-bestaetigt`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}

import type { MetadataRoute } from "next";
import { tropfshopBrand } from "@ufiso/shop-config/tropfshop";
import { getAllRatgeberArticles } from "@/lib/ratgeber";

/**
 * sitemap.xml — Phase 1.
 *
 * Enthaelt die Pre-Launch-Page, die DOI-Bestaetigungs-Page sowie ab Sprint 12
 * die indexierbaren Ratgeber-Seiten (Uebersicht + Artikel). Der Produktbereich
 * bleibt bewusst DRAUSSEN, solange er `noindex` ist (kein Preis/Bestellung).
 * Die DOI-Seite ist per Page-Metadata `noindex`, bleibt aber gelistet, damit
 * Crawler sie kennen (kein spaeteres "Soft-404").
 *
 * Vault: 05-Content-und-SEO/SEO-Strategie.md "Technical SEO".
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = `https://${tropfshopBrand.domains.de}`;
  const lastModified = new Date();

  const ratgeberEntries: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/ratgeber`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    ...getAllRatgeberArticles().map((article) => ({
      url: `${baseUrl}/ratgeber/${article.slug}`,
      lastModified: new Date(article.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];

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
    ...ratgeberEntries,
  ];
}

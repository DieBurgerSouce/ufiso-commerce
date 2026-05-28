import type { MetadataRoute } from "next";
import { hofladenBrand } from "@ufiso/shop-config/hofladen";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = `https://${hofladenBrand.domains.de}`;
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

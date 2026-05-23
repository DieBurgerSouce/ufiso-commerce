import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { tropfshopBrand, tropfshopLegal } from "@ufiso/shop-config/tropfshop";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap" });

const baseUrl = `https://${tropfshopBrand.domains.de}`;

export const metadata: Metadata = {
  title: tropfshopBrand.meta.defaultTitle,
  description: tropfshopBrand.meta.defaultDescription,
  metadataBase: new URL(baseUrl),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: tropfshopBrand.meta.defaultTitle,
    description: tropfshopBrand.meta.defaultDescription,
    url: baseUrl,
    siteName: tropfshopBrand.name,
    locale: "de_DE",
    type: "website",
    // og:image wird ueber app/opengraph-image.tsx automatisch ergaenzt.
  },
  twitter: {
    card: "summary_large_image",
    title: tropfshopBrand.meta.defaultTitle,
    description: tropfshopBrand.meta.defaultDescription,
    // twitter:image wird ueber app/twitter-image.tsx automatisch ergaenzt.
  },
  robots: {
    // Pre-Launch: noch nicht indexieren lassen (Phase 1).
    index: false,
    follow: false,
  },
};

/**
 * Organization-JSON-LD fuer Schema.org. Wird inline ins `<head>` gerendert,
 * damit Google den Brand-Eintrag (Knowledge-Panel) sauber zuordnen kann.
 * Siehe Vault: 05-Content-und-SEO/SEO-Strategie.md "Technical SEO".
 */
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: tropfshopBrand.name,
  legalName: tropfshopBrand.legalName,
  url: baseUrl,
  logo: `${baseUrl}${tropfshopBrand.logo.light}`,
  description: tropfshopBrand.meta.defaultDescription,
  address: {
    "@type": "PostalAddress",
    addressLocality: tropfshopLegal.address.city,
    addressCountry: "DE",
  },
  contactPoint: [
    {
      "@type": "ContactPoint",
      contactType: "customer service",
      email: tropfshopBrand.contact.email,
      availableLanguage: ["de"],
    },
  ],
  sameAs: [
    tropfshopBrand.social.instagram
      ? `https://instagram.com/${tropfshopBrand.social.instagram}`
      : null,
    tropfshopBrand.social.youtube
      ? `https://youtube.com/@${tropfshopBrand.social.youtube}`
      : null,
    tropfshopBrand.social.facebook
      ? `https://facebook.com/${tropfshopBrand.social.facebook}`
      : null,
  ].filter((url): url is string => Boolean(url)),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <head>
        <script
          type="application/ld+json"
          // JSON.stringify wird XSS-sicher ueber dangerouslySetInnerHTML
          // ausgespielt — Inhalt stammt ausschliesslich aus shop-config
          // und ist statisch.
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd),
          }}
        />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}

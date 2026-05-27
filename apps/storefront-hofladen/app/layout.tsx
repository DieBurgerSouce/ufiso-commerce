import type { Metadata } from "next";
import { Inter } from "next/font/google";
import {
  hofladenBrand,
  hofladenKlaroConfig,
  hofladenLegal,
} from "@ufiso/shop-config/hofladen";
import { KlaroProvider } from "@/components/klaro-provider";
import { TestErrorBridge } from "@/components/test-error-bridge";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap" });

const baseUrl = `https://${hofladenBrand.domains.de}`;

export const metadata: Metadata = {
  title: hofladenBrand.meta.defaultTitle,
  description: hofladenBrand.meta.defaultDescription,
  metadataBase: new URL(baseUrl),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: hofladenBrand.meta.defaultTitle,
    description: hofladenBrand.meta.defaultDescription,
    url: baseUrl,
    siteName: hofladenBrand.name,
    locale: "de_DE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: hofladenBrand.meta.defaultTitle,
    description: hofladenBrand.meta.defaultDescription,
  },
  robots: {
    // Pre-Launch + Sprint-11-FUNKTIONALER-Stresstest: nicht indexieren.
    index: false,
    follow: false,
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: hofladenBrand.name,
  legalName: hofladenBrand.legalName,
  url: baseUrl,
  logo: `${baseUrl}${hofladenBrand.logo.light}`,
  description: hofladenBrand.meta.defaultDescription,
  address: {
    "@type": "PostalAddress",
    addressLocality: hofladenLegal.address.city,
    addressCountry: "DE",
  },
  contactPoint: [
    {
      "@type": "ContactPoint",
      contactType: "customer service",
      email: hofladenBrand.contact.email,
      availableLanguage: ["de"],
    },
  ],
  sameAs: [
    hofladenBrand.social.instagram
      ? `https://instagram.com/${hofladenBrand.social.instagram}`
      : null,
    hofladenBrand.social.youtube
      ? `https://youtube.com/@${hofladenBrand.social.youtube}`
      : null,
    hofladenBrand.social.facebook
      ? `https://facebook.com/${hofladenBrand.social.facebook}`
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
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd),
          }}
        />
      </head>
      <body className={inter.className}>
        {children}
        <KlaroProvider config={hofladenKlaroConfig} />
        {process.env.NEXT_PUBLIC_ENABLE_TEST_BRIDGE === "1" ? (
          <TestErrorBridge />
        ) : null}
      </body>
    </html>
  );
}

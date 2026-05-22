import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { tropfshopBrand } from "@ufiso/shop-config/tropfshop";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: tropfshopBrand.meta.defaultTitle,
  description: tropfshopBrand.meta.defaultDescription,
  metadataBase: new URL(`https://${tropfshopBrand.domains.de}`),
  openGraph: {
    title: tropfshopBrand.meta.defaultTitle,
    description: tropfshopBrand.meta.defaultDescription,
    locale: "de_DE",
    type: "website",
  },
  robots: {
    // Pre-Launch: noch nicht indexieren lassen.
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body className={inter.className}>{children}</body>
    </html>
  );
}

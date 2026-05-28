import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { tropfshopBrand } from "@ufiso/shop-config/tropfshop";
import { PageShell } from "@/components/page-shell";
import { JsonLd } from "@/components/json-ld";
import { NewsletterForm } from "@/components/newsletter-form";
import { fetchProductByHandle } from "@/lib/catalog";

/**
 * Produkt-Detailseite (/produkte/[handle]) — PDP-lite.
 *
 * Phase 1: kein Preis, kein Warenkorb (Verrechnungspreis-Methode offen). Die
 * Seite zeigt Beschreibung + "Bald verfügbar" und fuehrt zum Newsletter.
 * Dynamisch gerendert (Backend-abhaengig); `notFound()` bei unbekanntem Handle.
 * `noindex` bis zum Launch (siehe app/robots.ts).
 */

const baseUrl = `https://${tropfshopBrand.domains.de}`;

// Live aus Medusa lesen (kein Build-Zeit-Prerender ohne Backend).
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ handle: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const product = await fetchProductByHandle(handle);

  if (!product) {
    return {
      title: `Produkt nicht gefunden — ${tropfshopBrand.name}`,
      robots: { index: false, follow: false },
    };
  }

  const description =
    product.description ?? tropfshopBrand.meta.defaultDescription;

  return {
    title: `${product.title} — ${tropfshopBrand.name}`,
    description,
    alternates: { canonical: `/produkte/${product.handle}` },
    openGraph: {
      title: product.title,
      description,
      url: `${baseUrl}/produkte/${product.handle}`,
      type: "website",
    },
    // Pre-Launch: Produktseiten noch nicht indexieren lassen.
    robots: { index: false, follow: false },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { handle } = await params;
  const product = await fetchProductByHandle(handle);

  if (!product) {
    notFound();
  }

  const productUrl = `${baseUrl}/produkte/${product.handle}`;

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    ...(product.description ? { description: product.description } : {}),
    ...(product.categoryName ? { category: product.categoryName } : {}),
    brand: { "@type": "Brand", name: tropfshopBrand.name },
    url: productUrl,
  };

  const breadcrumbItems = [
    { name: "Start", url: `${baseUrl}/` },
    { name: "Sortiment", url: `${baseUrl}/produkte` },
    ...(product.categoryHandle && product.categoryName
      ? [
          {
            name: product.categoryName,
            url: `${baseUrl}/produkte/kategorie/${product.categoryHandle}`,
          },
        ]
      : []),
    { name: product.title, url: productUrl },
  ];

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbItems.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <PageShell>
      <JsonLd data={productJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />

      <article className="mx-auto w-full max-w-3xl px-6 py-12 sm:py-16">
        <nav aria-label="Brotkrumen" className="mb-6 text-sm text-neutral-400">
          <Link href="/" className="hover:text-accent">
            Start
          </Link>{" "}
          <span aria-hidden>/</span>{" "}
          <Link href="/produkte" className="hover:text-accent">
            Sortiment
          </Link>{" "}
          {product.categoryHandle && product.categoryName && (
            <>
              <span aria-hidden>/</span>{" "}
              <Link
                href={`/produkte/kategorie/${product.categoryHandle}`}
                className="hover:text-accent"
              >
                {product.categoryName}
              </Link>{" "}
            </>
          )}
          <span aria-hidden>/</span>{" "}
          <span className="text-neutral-200">{product.title}</span>
        </nav>

        {product.categoryName && (
          <span className="text-xs font-medium uppercase tracking-wide text-accent/90">
            {product.categoryName}
          </span>
        )}
        <h1 className="mt-2 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          {product.title}
        </h1>

        <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1 text-sm font-medium text-accent ring-1 ring-inset ring-accent/30">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          Bald verfügbar
        </span>

        {product.description && (
          <p className="mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-neutral-300">
            {product.description}
          </p>
        )}

        <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <h2 className="text-lg font-semibold tracking-tight">
            Zum Launch benachrichtigt werden
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-neutral-400">
            Preise und Bestellung folgen zum Launch im März 2027. Tragen Sie
            sich ein und sichern Sie sich 10&nbsp;% Frühbucher-Rabatt auf Ihre
            erste Bestellung.
          </p>
          <div className="mt-6 max-w-md">
            <NewsletterForm />
          </div>
        </div>

        <p className="mt-10 text-sm">
          <Link
            href="/produkte"
            className="text-accent underline underline-offset-4 hover:text-accent/80"
          >
            ← Zurück zum Sortiment
          </Link>
        </p>
      </article>
    </PageShell>
  );
}

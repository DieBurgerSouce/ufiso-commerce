import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { tropfshopBrand } from "@ufiso/shop-config/tropfshop";
import { PageShell } from "@/components/page-shell";
import { ProductGrid } from "@/components/product-grid";
import { JsonLd } from "@/components/json-ld";
import { fetchCategoryByHandle, fetchProducts } from "@/lib/catalog";

/**
 * Kategorie-Seite (/produkte/kategorie/[handle]) — Produkte einer Kategorie.
 *
 * Phase 1: `noindex` (Produktbereich ohne Preis/Bestellung). Dient der SEO-
 * Struktur fuer spaeter und der Navigation. `notFound()` bei unbekanntem Handle.
 */

const baseUrl = `https://${tropfshopBrand.domains.de}`;

// Live aus Medusa lesen (kein Build-Zeit-Prerender ohne Backend).
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ handle: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const category = await fetchCategoryByHandle(handle);

  if (!category) {
    return {
      title: `Kategorie nicht gefunden — ${tropfshopBrand.name}`,
      robots: { index: false, follow: false },
    };
  }

  const description =
    category.description ??
    `${category.name} im Tropfshop-Sortiment. Preise und Bestellung folgen zum Launch im März 2027.`;

  return {
    title: `${category.name} — ${tropfshopBrand.name}`,
    description,
    alternates: { canonical: `/produkte/kategorie/${category.handle}` },
    openGraph: {
      title: `${category.name} — ${tropfshopBrand.name}`,
      description,
      url: `${baseUrl}/produkte/kategorie/${category.handle}`,
      type: "website",
    },
    robots: { index: false, follow: false },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { handle } = await params;
  const category = await fetchCategoryByHandle(handle);

  if (!category) {
    notFound();
  }

  const products = await fetchProducts({ categoryId: category.id, limit: 200 });

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { name: "Start", url: `${baseUrl}/` },
      { name: "Sortiment", url: `${baseUrl}/produkte` },
      {
        name: category.name,
        url: `${baseUrl}/produkte/kategorie/${category.handle}`,
      },
    ].map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <PageShell>
      <JsonLd data={breadcrumbJsonLd} />

      <div className="mx-auto w-full max-w-5xl px-6 py-12 sm:py-16">
        <nav aria-label="Brotkrumen" className="mb-6 text-sm text-neutral-400">
          <Link href="/" className="hover:text-accent">
            Start
          </Link>{" "}
          <span aria-hidden>/</span>{" "}
          <Link href="/produkte" className="hover:text-accent">
            Sortiment
          </Link>{" "}
          <span aria-hidden>/</span>{" "}
          <span className="text-neutral-200">{category.name}</span>
        </nav>

        <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          {category.name}
        </h1>
        {category.description && (
          <p className="mt-4 max-w-2xl text-pretty leading-relaxed text-neutral-300">
            {category.description}
          </p>
        )}

        <div className="mt-12">
          {products.length === 0 ? (
            <p className="rounded-2xl border border-white/10 bg-white/[0.02] px-6 py-10 text-center text-neutral-400">
              Für diese Kategorie sind die Produkte gerade in Vorbereitung.
            </p>
          ) : (
            <ProductGrid
              products={products}
              hrefFor={(p) => `/produkte/${p.handle}`}
            />
          )}
        </div>

        <p className="mt-10 text-sm">
          <Link
            href="/produkte"
            className="text-accent underline underline-offset-4 hover:text-accent/80"
          >
            ← Zurück zum Sortiment
          </Link>
        </p>
      </div>
    </PageShell>
  );
}

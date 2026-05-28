import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { ProductGrid } from "@/components/product-grid";
import {
  fetchCategories,
  fetchProducts,
  type CatalogProduct,
} from "@/lib/catalog";

/**
 * Sortiment-Uebersicht (/produkte) — Produkte nach Kategorie gruppiert.
 *
 * Phase 1 / Pre-Launch: bewusst `noindex` (kein Preis, keine Bestellung — die
 * Seite ist eine Vorschau). Der SEO-Fokus liegt diesen Sprint auf dem Ratgeber.
 * Faellt der Medusa-Fetch aus, zeigt die Seite einen ruhigen Leer-Zustand
 * (graceful degrade) statt eines Fehlers.
 */
export const metadata: Metadata = {
  title: "Sortiment — Tropfbewässerung für Garten und Klein-Gewerbe",
  description:
    "Das Tropfshop-Sortiment im Überblick: Tropfschläuche, Druckminderer, Verbinder, Tropfer, Filter, Ventile und Komplett-Sets. Preise und Bestellung folgen zum Launch im März 2027.",
  alternates: { canonical: "/produkte" },
  // Pre-Launch: Produktseiten noch nicht indexieren lassen (siehe app/robots.ts).
  robots: { index: false, follow: false },
};

// Live aus Medusa lesen (kein Build-Zeit-Prerender ohne Backend).
export const dynamic = "force-dynamic";

export default async function ProduktePage() {
  const [categories, products] = await Promise.all([
    fetchCategories(),
    fetchProducts({ limit: 200 }),
  ]);

  // Produkte nach Kategorie-Handle gruppieren.
  const byCategory = new Map<string, CatalogProduct[]>();
  for (const product of products) {
    const key = product.categoryHandle ?? "_uncategorized";
    const list = byCategory.get(key) ?? [];
    list.push(product);
    byCategory.set(key, list);
  }

  // Anzeige-Reihenfolge: Reihenfolge der Kategorie-Liste aus dem Backend,
  // danach evtl. unkategorisierte Produkte.
  const orderedSections = categories
    .map((category) => ({
      category,
      products: byCategory.get(category.handle) ?? [],
    }))
    .filter((section) => section.products.length > 0);

  const uncategorized = byCategory.get("_uncategorized") ?? [];

  return (
    <PageShell>
      <div className="mx-auto w-full max-w-5xl px-6 py-12 sm:py-16">
        <nav aria-label="Brotkrumen" className="mb-6 text-sm text-neutral-400">
          <Link href="/" className="hover:text-accent">
            Start
          </Link>{" "}
          <span aria-hidden>/</span> <span className="text-neutral-200">Sortiment</span>
        </nav>

        <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          Unser Sortiment
        </h1>
        <p className="mt-4 max-w-2xl text-pretty leading-relaxed text-neutral-300">
          Ein Auszug aus dem Startsortiment für Tropfbewässerung — technisch
          durchdacht, von Tropfschlauch bis Komplett-Set. Preise und Bestellung
          folgen zum Launch im März 2027.
        </p>

        {orderedSections.length === 0 && uncategorized.length === 0 ? (
          <p className="mt-16 rounded-2xl border border-white/10 bg-white/[0.02] px-6 py-10 text-center text-neutral-400">
            Das Sortiment wird gerade vorbereitet und ist in Kürze hier zu
            sehen. Tragen Sie sich auf der{" "}
            <Link href="/" className="text-accent underline underline-offset-4">
              Startseite
            </Link>{" "}
            in den Newsletter ein, dann melden wir uns zum Launch.
          </p>
        ) : (
          <div className="mt-12 flex flex-col gap-16">
            {orderedSections.map(({ category, products: categoryProducts }) => (
              <section
                key={category.id}
                aria-labelledby={`cat-${category.handle}`}
              >
                <div className="mb-6 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <h2
                    id={`cat-${category.handle}`}
                    className="text-xl font-semibold tracking-tight sm:text-2xl"
                  >
                    <Link
                      href={`/produkte/kategorie/${category.handle}`}
                      className="transition hover:text-accent"
                    >
                      {category.name}
                    </Link>
                  </h2>
                  <Link
                    href={`/produkte/kategorie/${category.handle}`}
                    className="text-sm text-accent underline underline-offset-4 hover:text-accent/80"
                  >
                    Alle ansehen →
                  </Link>
                </div>
                {category.description && (
                  <p className="mb-6 max-w-2xl text-sm leading-relaxed text-neutral-400">
                    {category.description}
                  </p>
                )}
                <ProductGrid
                  products={categoryProducts}
                  hrefFor={(p) => `/produkte/${p.handle}`}
                />
              </section>
            ))}

            {uncategorized.length > 0 && (
              <section aria-labelledby="cat-weitere">
                <h2
                  id="cat-weitere"
                  className="mb-6 text-xl font-semibold tracking-tight sm:text-2xl"
                >
                  Weitere Produkte
                </h2>
                <ProductGrid
                  products={uncategorized}
                  hrefFor={(p) => `/produkte/${p.handle}`}
                />
              </section>
            )}
          </div>
        )}
      </div>
    </PageShell>
  );
}

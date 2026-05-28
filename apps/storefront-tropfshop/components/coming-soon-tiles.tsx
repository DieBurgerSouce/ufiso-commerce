import Link from "next/link";
import { fetchProducts } from "@/lib/catalog";
import { ProductGrid } from "@/components/product-grid";

/**
 * "Bald verfuegbar"-Tiles auf der Pre-Launch-Page.
 *
 * Server Component — holt bis zu 6 Produkte aus dem Sales Channel `tropfshop`
 * (via lib/catalog → Medusa Store SDK, Publishable Key gescoped). Keine Preise,
 * keine Add-to-Cart: reine Vorschau. Faellt der Fetch (Backend down oder noch
 * keine Produkte), rendert die Komponente `null` (graceful degrade).
 *
 * Seit Sprint 12 verlinkt ein Hinweis aufs vollstaendige Sortiment (/produkte).
 */

const TILE_LIMIT = 6;

export async function ComingSoonTiles() {
  const products = await fetchProducts({ limit: TILE_LIMIT });
  if (products.length === 0) return null;

  return (
    <section
      aria-labelledby="coming-soon-tiles-heading"
      className="relative border-t border-white/10 px-6 py-16"
    >
      <div className="mx-auto w-full max-w-5xl">
        <h2
          id="coming-soon-tiles-heading"
          className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl"
        >
          Das wird&apos;s bei uns geben
        </h2>
        <p className="mt-2 max-w-xl text-sm text-neutral-400">
          Ein Auszug aus dem Startsortiment — Preise und Bestellung folgen zum
          Launch im März 2027.
        </p>

        <div className="mt-10">
          <ProductGrid products={products} />
        </div>

        <p className="mt-8 text-sm text-neutral-400">
          <Link
            href="/produkte"
            className="font-medium text-accent underline underline-offset-4 hover:text-accent/80"
          >
            Ganzes Sortiment ansehen →
          </Link>
        </p>
      </div>
    </section>
  );
}

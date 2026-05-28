import Link from "next/link";

/**
 * Wiederverwendbare Produkt-Kachel (Server Component).
 *
 * Visuelle Sprache aus der urspruenglichen Coming-Soon-Tile extrahiert, damit
 * Coming-Soon-Page und Katalog (/produkte, /produkte/kategorie/[handle]) das
 * gleiche Aussehen teilen. Phase 1: kein Preis, kein Add-to-Cart.
 *
 * - Mit `href` wird die Kachel zu einem Link (Katalog → Detailseite).
 * - Ohne `href` ist sie eine reine Vorschau (Coming-Soon-Page).
 */

export type ProductTileData = {
  id: string;
  title: string;
  description?: string | null;
};

const CARD_BASE =
  "group flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] transition";
const CARD_INTERACTIVE =
  "hover:border-accent/40 hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60";

function TileInner({ product }: { product: ProductTileData }) {
  return (
    <>
      <div
        aria-hidden
        className="relative h-32 w-full bg-[radial-gradient(40rem_20rem_at_30%_-20%,rgb(var(--color-primary)/0.55),transparent),radial-gradient(30rem_15rem_at_100%_120%,rgb(var(--color-accent)/0.45),transparent)]"
      >
        <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-2.5 py-1 text-xs font-medium text-accent ring-1 ring-inset ring-accent/30">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          Bald verfügbar
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="text-base font-semibold leading-snug text-neutral-100">
          {product.title}
        </h3>
        {product.description && (
          <p className="line-clamp-2 text-sm leading-relaxed text-neutral-400">
            {product.description}
          </p>
        )}
      </div>
    </>
  );
}

export function ProductTile({
  product,
  href,
}: {
  product: ProductTileData;
  href?: string;
}) {
  if (href) {
    return (
      <Link href={href} className={`${CARD_BASE} ${CARD_INTERACTIVE}`}>
        <TileInner product={product} />
      </Link>
    );
  }
  return (
    <div className={CARD_BASE}>
      <TileInner product={product} />
    </div>
  );
}

import { medusa } from "@/lib/medusa";

/**
 * "Bald verfuegbar"-Tiles auf der Pre-Launch-Page.
 *
 * Server Component — holt bis zu 6 Produkte aus dem Sales Channel `tropfshop`
 * via Medusa JS SDK (Publishable Key ist gescoped, siehe Vault
 * 02-Architektur/Medusa-Sales-Channels.md). Keine Preise, keine Add-to-Cart,
 * keine Detail-Links: die Tiles sind eine reine Vorschau bis zum Launch.
 *
 * Faellt der Fetch (z. B. Backend nicht erreichbar oder noch keine Produkte),
 * rendert die Komponente `null` — die Seite bleibt clean (graceful degrade).
 */

const TILE_LIMIT = 6;

type TileProduct = {
  id: string;
  title: string;
  description: string | null;
};

async function fetchTiles(): Promise<TileProduct[]> {
  try {
    const { products } = await medusa.store.product.list({
      limit: TILE_LIMIT,
      fields: "id,title,description",
    });
    return products.map((p) => ({
      id: p.id,
      title: p.title ?? "",
      description: p.description ?? null,
    }));
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    console.warn(`[coming-soon-tiles] Fetch fehlgeschlagen: ${reason}`);
    return [];
  }
}

export async function ComingSoonTiles() {
  const products = await fetchTiles();
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

        <ul className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <li
              key={product.id}
              className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] transition hover:border-accent/40 hover:bg-white/[0.04]"
            >
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
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

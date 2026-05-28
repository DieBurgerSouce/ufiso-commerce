import { cache } from "react";
import { medusa } from "@/lib/medusa";

/**
 * Katalog-Datenzugriff (Tropfshop) — duenne Wrapper um das Medusa-Store-SDK.
 *
 * Bewusst KEINE custom Store-API im Backend (Anti-Overengineering): die
 * Storefront liest Kategorien + Produkte direkt ueber den gescopten
 * Publishable Key (Sales Channel `tropfshop`). Alle Funktionen degradieren
 * graceful — faellt der Fetch (Backend down, noch keine Daten), liefern sie
 * leere Listen bzw. `null`, damit die Seiten clean rendern (gleiches Muster
 * wie components/coming-soon-tiles.tsx).
 *
 * Phase 1: KEINE Preise, kein Warenkorb (Verrechnungspreis-Methode offen,
 * siehe Vault 08-Entscheidungen). Daher werden Preisfelder nicht angefragt.
 */

const PRODUCT_FIELDS =
  "id,title,handle,description,thumbnail,categories.id,categories.name,categories.handle";

export type CatalogProduct = {
  id: string;
  title: string;
  handle: string;
  description: string | null;
  thumbnail: string | null;
  /** Erste zugeordnete Kategorie (jedes Mock-Produkt hat genau eine). */
  categoryHandle: string | null;
  categoryName: string | null;
};

export type CatalogCategory = {
  id: string;
  name: string;
  handle: string;
  description: string | null;
};

type RawCategory = {
  id?: string | null;
  name?: string | null;
  handle?: string | null;
  description?: string | null;
};

type RawProduct = {
  id?: string | null;
  title?: string | null;
  handle?: string | null;
  description?: string | null;
  thumbnail?: string | null;
  categories?: RawCategory[] | null;
};

function toCatalogProduct(p: RawProduct): CatalogProduct {
  const firstCategory = p.categories?.[0];
  return {
    id: p.id ?? "",
    title: p.title ?? "",
    handle: p.handle ?? "",
    description: p.description ?? null,
    thumbnail: p.thumbnail ?? null,
    categoryHandle: firstCategory?.handle ?? null,
    categoryName: firstCategory?.name ?? null,
  };
}

function warn(scope: string, err: unknown): void {
  const reason = err instanceof Error ? err.message : String(err);
  console.warn(`[catalog] ${scope} fehlgeschlagen: ${reason}`);
}

/** Alle aktiven Kategorien des Sales Channels. */
export async function fetchCategories(): Promise<CatalogCategory[]> {
  try {
    const { product_categories } = await medusa.store.category.list({
      fields: "id,name,handle,description",
      limit: 100,
    });
    return (product_categories as RawCategory[])
      .filter((c) => c.id && c.handle)
      .map((c) => ({
        id: c.id as string,
        name: c.name ?? "",
        handle: c.handle as string,
        description: c.description ?? null,
      }));
  } catch (err) {
    warn("fetchCategories", err);
    return [];
  }
}

/** Produkte des Channels, optional auf eine Kategorie gefiltert. */
export async function fetchProducts(opts?: {
  categoryId?: string;
  limit?: number;
}): Promise<CatalogProduct[]> {
  try {
    const { products } = await medusa.store.product.list({
      fields: PRODUCT_FIELDS,
      limit: opts?.limit ?? 100,
      ...(opts?.categoryId ? { category_id: opts.categoryId } : {}),
    });
    return (products as RawProduct[]).map(toCatalogProduct);
  } catch (err) {
    warn("fetchProducts", err);
    return [];
  }
}

/**
 * Einzelnes Produkt per Handle — `null`, wenn nicht gefunden oder Backend down.
 * Per-Request memoisiert (React `cache`), damit generateMetadata + Render nicht
 * doppelt fetchen (Vercel-Skill `server-cache-react`).
 */
export const fetchProductByHandle = cache(async function fetchProductByHandle(
  handle: string,
): Promise<CatalogProduct | null> {
  try {
    const { products } = await medusa.store.product.list({
      handle,
      fields: PRODUCT_FIELDS,
      limit: 1,
    });
    const product = (products as RawProduct[])[0];
    return product ? toCatalogProduct(product) : null;
  } catch (err) {
    warn("fetchProductByHandle", err);
    return null;
  }
});

/**
 * Einzelne Kategorie per Handle — `null`, wenn nicht gefunden oder Backend down.
 * Per-Request memoisiert (React `cache`).
 */
export const fetchCategoryByHandle = cache(async function fetchCategoryByHandle(
  handle: string,
): Promise<CatalogCategory | null> {
  try {
    const { product_categories } = await medusa.store.category.list({
      handle,
      fields: "id,name,handle,description",
      limit: 1,
    });
    const category = (product_categories as RawCategory[])[0];
    if (!category?.id || !category.handle) return null;
    return {
      id: category.id,
      name: category.name ?? "",
      handle: category.handle,
      description: category.description ?? null,
    };
  } catch (err) {
    warn("fetchCategoryByHandle", err);
    return null;
  }
});

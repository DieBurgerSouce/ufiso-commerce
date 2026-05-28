import { ProductTile, type ProductTileData } from "@/components/product-tile";

/**
 * Grid-Wrapper fuer Produkt-Kacheln (Server Component).
 *
 * `hrefFor` macht die Kacheln optional klickbar (Katalog → Detailseite); ohne
 * `hrefFor` bleiben sie reine Vorschau (Coming-Soon-Page).
 */
export function ProductGrid<T extends ProductTileData>({
  products,
  hrefFor,
}: {
  products: T[];
  hrefFor?: (product: T) => string;
}) {
  return (
    <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <li key={product.id} className="flex">
          <ProductTile product={product} href={hrefFor?.(product)} />
        </li>
      ))}
    </ul>
  );
}

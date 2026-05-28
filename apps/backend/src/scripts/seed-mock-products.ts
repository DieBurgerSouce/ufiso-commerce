import { ExecArgs } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";
import { createProductsWorkflow } from "@medusajs/medusa/core-flows";
import { createComponentLogger } from "../lib/logger";

/**
 * UFISO / Tropfshop — Mock-Produkte fuer die Pre-Launch-Coming-Soon-Tiles.
 *
 * Idempotent ueber SKU: existierende Produkte (gleiche SKU) werden uebersprungen.
 * Channel-Zuordnung: nur `tropfshop`.
 *
 * KEINE PREISE — bewusst leer gelassen.
 * Begruendung: Channel-Konflikt-Schutz (Spargelmesser vs. UFISO) ist bis zum
 * Vater- und Steuerberater-Termin nicht geklaert (Vault: 08-Entscheidungen/
 * Offene-Entscheidungen.md, Punkt "Verrechnungspreis-Methode"). Die Coming-
 * Soon-Tiles zeigen ohnehin keine Preise — wird in der Tile-Component
 * (apps/storefront-tropfshop/components/coming-soon-tiles.tsx) auch nicht
 * ausgespielt.
 *
 * Phase 2 wird der gesamte Mock-Sortiment durch den realen Odoo→Medusa-Sync
 * ersetzt (siehe ADR-003 / ADR-007 / `odoo-sync`-Modul).
 *
 * Ausfuehren:  pnpm --filter @ufiso/backend seed:products
 */

type MockProduct = {
  title: string;
  handle: string;
  description: string;
  sku: string;
};

/** Sprint 11 C.2 — Multi-Shop. Channel-Slug entspricht Medusa-Channel-Name. */
type ShopChannel = "tropfshop" | "hofladen";

const TROPFSHOP_MOCK_PRODUCTS: MockProduct[] = [
  {
    title: "Rivulis Aries 16 mm Tropfschlauch, 250 m Rolle",
    handle: "rivulis-aries-16mm-250m",
    description:
      "Druckkompensierender Tropfschlauch fuer Reihenkulturen und groessere Beete. Lieferung als 250 m Rolle, Tropferabstand 30 cm.",
    sku: "SM-TRP-0001",
  },
  {
    title: "Rivulis Aries 16 mm Tropfschlauch, 50 m Rolle",
    handle: "rivulis-aries-16mm-50m",
    description:
      "Kompakte 50 m Rolle des Rivulis-Aries-Tropfschlauchs fuer Hochbeete und kleinere Beete. Tropferabstand 30 cm, druckkompensierend.",
    sku: "SM-TRP-0002",
  },
  {
    title: "Irritec P1 Druckminderer, 2 bar",
    handle: "irritec-p1-druckminderer-2bar",
    description:
      "Druckminderer fuer Tropfbewaesserungs-Systeme an Haushalts-Leitungen. Halbiert den Eingangsdruck zuverlaessig auf 2 bar.",
    sku: "SM-TRP-0003",
  },
  {
    title: "Senninger Druckminderer, 1,5 bar",
    handle: "senninger-druckminderer-1-5bar",
    description:
      "Robuster Senninger-Druckregler fuer Niederdruck-Tropfsysteme. Stabiler Ausgangsdruck von 1,5 bar auch bei wechselnder Versorgung.",
    sku: "SM-TRP-0004",
  },
  {
    title: "T-Stueck 16 mm",
    handle: "t-stueck-16mm",
    description:
      "Klemmverbinder T-Stueck fuer 16-mm-Schlaeuche. Werkzeuglose Montage, dichtet ohne Dichtmittel.",
    sku: "SM-TRP-0005",
  },
  {
    title: "Endkappe 16 mm",
    handle: "endkappe-16mm",
    description:
      "Klemmbare Endkappe fuer 16-mm-Tropfschlaeuche. Schliesst Leitungsenden zuverlaessig ab und laesst sich zum Spuelen oeffnen.",
    sku: "SM-TRP-0006",
  },
  {
    title: "Reihen-Tropfer 2 L/h, 100 Stueck",
    handle: "reihen-tropfer-2lh-100stk",
    description:
      "Druckkompensierende Einzel-Tropfer mit 2 L/h Durchfluss zum Einstechen in Verteilerschlaeuche. Set mit 100 Stueck.",
    sku: "SM-TRP-0007",
  },
  {
    title: "Lay-Flat-Schlauch, 50 m Rolle",
    handle: "lay-flat-schlauch-50m",
    description:
      "Flacher Verteilerschlauch mit hohem Durchfluss fuer Reihenkulturen. 50 m Rolle, einfach auszurollen und zu lagern.",
    sku: "SM-TRP-0008",
  },
  {
    title: "Scheibenfilter 3/4 Zoll",
    handle: "scheibenfilter-3-4-zoll",
    description:
      "Scheibenfilter mit 120 mesh zum Schutz der Tropfer vor Sedimenten. 3/4-Zoll-Anschluss, leicht zu reinigen.",
    sku: "SM-TRP-0009",
  },
  {
    title: "Magnetventil 3/4 Zoll, 24 V AC",
    handle: "magnetventil-3-4-zoll-24v",
    description:
      "24-V-AC-Magnetventil fuer die Automatisierung einzelner Bewaesserungs-Kreise. Lange Lebensdauer, leise im Betrieb.",
    sku: "SM-TRP-0010",
  },
  {
    title: "Komplett-Set Hochbeet 4 m²",
    handle: "set-hochbeet-4qm",
    description:
      "Komplett-Bewaesserung fuer ein Hochbeet bis 4 m². Inklusive Druckminderer, Verteilerschlauch, Tropfern und Anschluessen.",
    sku: "SM-TRP-0011",
  },
  {
    title: "Komplett-Set Tomaten, 10 Pflanzen",
    handle: "set-tomaten-10-pflanzen",
    description:
      "Vorkonfiguriertes Bewaesserungs-Set fuer bis zu 10 Tomatenpflanzen. Mit druckkompensierenden Einzeltropfern und Verbindern.",
    sku: "SM-TRP-0012",
  },
  {
    title: "Komplett-Set Balkonkasten, 2 m",
    handle: "set-balkonkasten-2m",
    description:
      "Tropfbewaesserung fuer Balkonkaesten bis 2 m Gesamtlaenge. Inklusive Wasserhahn-Anschluss und vorgefertigten Stechtropfern.",
    sku: "SM-TRP-0013",
  },
  {
    title: "Bewaesserungscomputer mechanisch, 1 Kreis",
    handle: "bewaesserungscomputer-mech-1-kreis",
    description:
      "Mechanischer Bewaesserungs-Timer fuer einen Kreis. Batterielos, einfache Einstellung der Bewaesserungs-Dauer.",
    sku: "SM-TRP-0014",
  },
  {
    title: "Verteilerblock 4-fach, 3/4 Zoll",
    handle: "verteilerblock-4fach-3-4-zoll",
    description:
      "Vierfach-Verteilerblock zum Aufteilen einer Wasserleitung auf bis zu vier unabhaengige Bewaesserungs-Kreise. 3/4-Zoll-Eingang.",
    sku: "SM-TRP-0015",
  },
  // ─── Sprint-10 B.4: Rivulis-Aries-Familie komplett (16/20 mm × 50/100/250/500 m) ───
  {
    title: "Rivulis Aries 16 mm Tropfschlauch, 100 m Rolle",
    handle: "rivulis-aries-16mm-100m",
    description:
      "Druckkompensierender Tropfschlauch fuer mittelgrosse Beete. 100 m Rolle, Tropferabstand 30 cm.",
    sku: "SM-TRP-0016",
  },
  {
    title: "Rivulis Aries 16 mm Tropfschlauch, 500 m Rolle",
    handle: "rivulis-aries-16mm-500m",
    description:
      "Profi-Rolle fuer Reihenkulturen und groessere Flaechen. 500 m, druckkompensierend, Tropferabstand 30 cm.",
    sku: "SM-TRP-0017",
  },
  {
    title: "Rivulis Aries 20 mm Tropfschlauch, 50 m Rolle",
    handle: "rivulis-aries-20mm-50m",
    description:
      "Verstaerkter 20-mm-Tropfschlauch fuer hoehere Durchflussmengen. 50 m Rolle, druckkompensierend.",
    sku: "SM-TRP-0018",
  },
  {
    title: "Rivulis Aries 20 mm Tropfschlauch, 100 m Rolle",
    handle: "rivulis-aries-20mm-100m",
    description:
      "20-mm-Aries-Tropfschlauch fuer mittlere bis grosse Beete. 100 m Rolle, druckkompensierend.",
    sku: "SM-TRP-0019",
  },
  {
    title: "Rivulis Aries 20 mm Tropfschlauch, 250 m Rolle",
    handle: "rivulis-aries-20mm-250m",
    description:
      "20-mm-Aries-Tropfschlauch fuer Reihenkulturen. 250 m Rolle, druckkompensierend, Tropferabstand 30 cm.",
    sku: "SM-TRP-0020",
  },
  {
    title: "Rivulis Aries 20 mm Tropfschlauch, 500 m Rolle",
    handle: "rivulis-aries-20mm-500m",
    description:
      "Profi-Rolle 20 mm Aries fuer Gemueseanbau und Landschaftsbau. 500 m Rolle, druckkompensierend.",
    sku: "SM-TRP-0021",
  },
  // ─── Sprint-10 B.4: Senninger-Druckminderer-Familie (0,7 / 1,0 / 1,5 / 2,0 bar) ───
  {
    title: "Senninger Druckminderer, 0,7 bar",
    handle: "senninger-druckminderer-0-7bar",
    description:
      "Senninger-Druckregler fuer Niederdruck-Tropfsysteme. Stabiler Ausgangsdruck 0,7 bar — fuer empfindliche Tropfer und Pflanzkulturen.",
    sku: "SM-TRP-0022",
  },
  {
    title: "Senninger Druckminderer, 1,0 bar",
    handle: "senninger-druckminderer-1-0bar",
    description:
      "Senninger-Druckregler mit konstantem Ausgangsdruck von 1,0 bar. Geeignet fuer Standard-Tropfschlaeuche und Mikro-Tropfer.",
    sku: "SM-TRP-0023",
  },
  {
    title: "Senninger Druckminderer, 2,0 bar",
    handle: "senninger-druckminderer-2-0bar",
    description:
      "Senninger-Druckregler mit 2,0 bar Ausgangsdruck. Fuer hoehere Durchfluesse und groessere Tropfsysteme.",
    sku: "SM-TRP-0024",
  },
  // ─── Sprint-10 B.4: Magnetventil-Varianten (3/4 ist bereits SM-TRP-0010) ───
  {
    title: "Magnetventil 1/2 Zoll, 24 V AC",
    handle: "magnetventil-1-2-zoll-24v",
    description:
      "Kompaktes 24-V-AC-Magnetventil fuer kleine Bewaesserungs-Kreise. 1/2-Zoll-Anschluss, leise und langlebig.",
    sku: "SM-TRP-0025",
  },
  {
    title: "Magnetventil 1 Zoll, 24 V AC",
    handle: "magnetventil-1-zoll-24v",
    description:
      "Robustes 24-V-AC-Magnetventil mit 1-Zoll-Anschluss fuer hohe Durchflussmengen. Lange Lebensdauer, leise im Betrieb.",
    sku: "SM-TRP-0026",
  },
  // ─── Sprint-10 B.4: 20-mm-Fittings als Pendant zur Aries-20mm-Familie ───
  {
    title: "T-Stueck 20 mm",
    handle: "t-stueck-20mm",
    description:
      "Klemmverbinder T-Stueck fuer 20-mm-Schlaeuche. Werkzeuglose Montage, dichtet ohne Dichtmittel.",
    sku: "SM-TRP-0027",
  },
  {
    title: "Endkappe 20 mm",
    handle: "endkappe-20mm",
    description:
      "Klemmbare Endkappe fuer 20-mm-Tropfschlaeuche. Schliesst Leitungsenden zuverlaessig ab und laesst sich zum Spuelen oeffnen.",
    sku: "SM-TRP-0028",
  },
  // ─── Sprint-10 B.4: Adapter + Zubehoer ───
  {
    title: "Reduzier-Verbinder 20 mm auf 16 mm",
    handle: "reduzier-verbinder-20-auf-16mm",
    description:
      "Reduzier-Verbinder zum Anschluss von 16-mm-Verteilern an 20-mm-Hauptleitungen. Werkzeuglose Klemmmontage.",
    sku: "SM-TRP-0029",
  },
  {
    title: "Tropfer-Pfeil 2 L/h, 50 Stueck",
    handle: "tropfer-pfeil-2lh-50stk",
    description:
      "Stechtropfer mit 2 L/h Durchfluss zum direkten Einstechen in Topf- oder Beeterde. 50er-Set, druckkompensierend.",
    sku: "SM-TRP-0030",
  },
  {
    title: "PE-Anschlussverschraubung 1/2 Zoll auf 16 mm",
    handle: "pe-anschlussverschraubung-1-2-auf-16mm",
    description:
      "Verschraubung zum Anschluss von 16-mm-Tropfschlauch an Standard-1/2-Zoll-Wasserleitungen. Inklusive Dichtung.",
    sku: "SM-TRP-0031",
  },
];

/**
 * Sprint 11 C.2 — Hofladen-Mock-Sortiment.
 *
 * Bewusst generische Lebensmittel-Kategorien OHNE echte Lieferanten- oder
 * Hofnamen — die Sourcing-Entscheidung ist Vater-blockiert (siehe
 * Vault: 09-Briefings/Lieferanten-UFISO-Brands-Brainstorm.md, Hofladen-Stub).
 * Diese 10 SKUs existieren ausschliesslich, damit der zweite Channel ein
 * sichtbares Coming-Soon-Tile-Set hat und die Multi-Shop-Architektur
 * funktional verifiziert werden kann. Visuelles Polishing + reale SKUs
 * kommen mit Sprint 12 nach Vater-Termin.
 */
const HOFLADEN_MOCK_PRODUCTS: MockProduct[] = [
  {
    title: "Schnittkaese vom Hof, 250 g",
    handle: "hof-schnittkaese-250g",
    description:
      "Junger Schnittkaese aus Vorzugsmilch, mild im Geschmack. Generisches Mock-Produkt fuer Sprint-11-Stresstest — finale Sortiments-Entscheidung steht aus.",
    sku: "HOF-0001",
  },
  {
    title: "Geraeucherte Bauernwurst, 200 g",
    handle: "hof-bauernwurst-200g",
    description:
      "Luftgetrocknete und geraeucherte Mettwurst, am Stueck. Generisches Mock-Produkt fuer Sprint-11-Stresstest.",
    sku: "HOF-0002",
  },
  {
    title: "Apfelsaft naturtrueb, 1 l Glasflasche",
    handle: "hof-apfelsaft-naturtrueb-1l",
    description:
      "Naturtrueber Apfelsaft aus eigenem Streuobst, in der 1-l-Glasflasche mit Pfand. Generisches Mock-Produkt fuer Sprint-11-Stresstest.",
    sku: "HOF-0003",
  },
  {
    title: "Bluetenhonig, 500 g Glas",
    handle: "hof-bluetenhonig-500g",
    description:
      "Regionaler Bluetenhonig vom Imker, cremig geruehrt, 500 g im Glas. Generisches Mock-Produkt fuer Sprint-11-Stresstest.",
    sku: "HOF-0004",
  },
  {
    title: "Erdbeer-Marmelade, 250 g Glas",
    handle: "hof-erdbeer-marmelade-250g",
    description:
      "Hausgemachte Erdbeer-Marmelade mit 50 % Fruchtanteil, 250 g im Glas. Generisches Mock-Produkt fuer Sprint-11-Stresstest.",
    sku: "HOF-0005",
  },
  {
    title: "Bandnudeln Hartweizen, 500 g",
    handle: "hof-bandnudeln-hartweizen-500g",
    description:
      "Bronzegezogene Bandnudeln aus Hartweizengriess, 500 g Beutel. Generisches Mock-Produkt fuer Sprint-11-Stresstest.",
    sku: "HOF-0006",
  },
  {
    title: "Rapsoel kalt gepresst, 500 ml",
    handle: "hof-rapsoel-kaltgepresst-500ml",
    description:
      "Kalt gepresstes Rapsoel mit nussigem Aroma, 500 ml Flasche. Generisches Mock-Produkt fuer Sprint-11-Stresstest.",
    sku: "HOF-0007",
  },
  {
    title: "Roggenmehl Type 1150, 1 kg",
    handle: "hof-roggenmehl-1150-1kg",
    description:
      "Steingemahlenes Roggenmehl Type 1150 fuer Sauerteig-Brote, 1 kg Tuete. Generisches Mock-Produkt fuer Sprint-11-Stresstest.",
    sku: "HOF-0008",
  },
  {
    title: "Kraeutertee lose, 100 g",
    handle: "hof-kraeutertee-lose-100g",
    description:
      "Lose Kraeutermischung aus Pfefferminze, Melisse und Brennnessel, 100 g im Aromabeutel. Generisches Mock-Produkt fuer Sprint-11-Stresstest.",
    sku: "HOF-0009",
  },
  {
    title: "Freilandeier, 10er Pack",
    handle: "hof-freilandeier-10er",
    description:
      "Eier aus Freilandhaltung, Groesse M, 10er-Pack im Karton. Generisches Mock-Produkt fuer Sprint-11-Stresstest.",
    sku: "HOF-0010",
  },
];

/**
 * Zentrales Mock-Sortiment fuer beide Channels. Sprint 11 C.2 — Hofladen-
 * SKUs werden NUR dem `hofladen`-Channel zugewiesen, Tropfshop-SKUs bleiben
 * exklusiv auf `tropfshop`. Multi-Channel-Produkte sind aktuell nicht
 * geplant (jeder Shop sein Sortiment), aber das Datenmodell wuerde es
 * unterstuetzen.
 */
const ALL_MOCK_PRODUCTS: ReadonlyArray<MockProduct & { channel: ShopChannel }> =
  [
    ...TROPFSHOP_MOCK_PRODUCTS.map((p) => ({
      ...p,
      channel: "tropfshop" as const,
    })),
    ...HOFLADEN_MOCK_PRODUCTS.map((p) => ({
      ...p,
      channel: "hofladen" as const,
    })),
  ];

export default async function seedMockProducts({ container }: ExecArgs) {
  const logger = createComponentLogger("mock-products");
  const productService = container.resolve(Modules.PRODUCT);
  const salesChannelService = container.resolve(Modules.SALES_CHANNEL);

  const channelByName = new Map<ShopChannel, string>();
  for (const channelName of ["tropfshop", "hofladen"] as const) {
    const [channel] = await salesChannelService.listSalesChannels({
      name: channelName,
    });
    if (!channel) {
      throw new Error(
        `Sales Channel '${channelName}' nicht gefunden. Bitte zuerst \`pnpm --filter @ufiso/backend seed\` ausfuehren.`,
      );
    }
    channelByName.set(channelName, channel.id);
  }

  // Idempotenz: existierende SKUs ermitteln und ueberspringen.
  const allSkus = ALL_MOCK_PRODUCTS.map((p) => p.sku);
  const existingVariants = await productService.listProductVariants({
    sku: allSkus,
  });
  const existingSkuSet = new Set(
    existingVariants.map((v) => v.sku).filter((s): s is string => Boolean(s)),
  );

  const toCreate = ALL_MOCK_PRODUCTS.filter(
    (p) => !existingSkuSet.has(p.sku),
  );

  if (toCreate.length === 0) {
    logger.info(
      {
        event: "mock_products.skip_all",
        total: ALL_MOCK_PRODUCTS.length,
        created: 0,
        skipped: ALL_MOCK_PRODUCTS.length,
      },
      `Mock-Produkte: bereits alle ${ALL_MOCK_PRODUCTS.length} Eintraege vorhanden, nichts zu tun.`,
    );
    return;
  }

  const byChannelCounts = toCreate.reduce<Record<ShopChannel, number>>(
    (acc, p) => {
      acc[p.channel] = (acc[p.channel] ?? 0) + 1;
      return acc;
    },
    { tropfshop: 0, hofladen: 0 },
  );

  logger.info(
    {
      event: "mock_products.create_start",
      total: ALL_MOCK_PRODUCTS.length,
      toCreate: toCreate.length,
      skipped: ALL_MOCK_PRODUCTS.length - toCreate.length,
      perChannel: byChannelCounts,
    },
    `Mock-Produkte: ${toCreate.length} von ${ALL_MOCK_PRODUCTS.length} werden neu angelegt (Tropfshop ${byChannelCounts.tropfshop} / Hofladen ${byChannelCounts.hofladen})...`,
  );

  await createProductsWorkflow(container).run({
    input: {
      products: toCreate.map((p) => ({
        title: p.title,
        handle: p.handle,
        description: p.description,
        status: "published" as const,
        options: [{ title: "Variante", values: ["Standard"] }],
        variants: [
          {
            title: "Standard",
            sku: p.sku,
            manage_inventory: false,
            options: { Variante: "Standard" },
            // Bewusst KEINE Preise — siehe Datei-Header.
            prices: [],
          },
        ],
        sales_channels: [{ id: channelByName.get(p.channel)! }],
      })),
    },
  });

  logger.info(
    {
      event: "mock_products.create_done",
      created: toCreate.length,
      skus: toCreate.map((p) => p.sku),
      total: ALL_MOCK_PRODUCTS.length,
    },
    `Mock-Produkte angelegt: ${toCreate.map((p) => p.sku).join(", ")}. Tiles haben insgesamt ${ALL_MOCK_PRODUCTS.length} Produkt(e).`,
  );
}

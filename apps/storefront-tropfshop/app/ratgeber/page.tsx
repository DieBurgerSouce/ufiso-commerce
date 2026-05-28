import type { Metadata } from "next";
import Link from "next/link";
import { tropfshopBrand } from "@ufiso/shop-config/tropfshop";
import { PageShell } from "@/components/page-shell";
import { JsonLd } from "@/components/json-ld";
import { getAllRatgeberArticles } from "@/lib/ratgeber";

/**
 * Ratgeber-Uebersicht (/ratgeber).
 *
 * Im Gegensatz zum Produktbereich sind die Ratgeber-Seiten in Phase 1 schon
 * INDEXIERBAR (robots index:true) — sie bauen ueber die Monate bis Launch
 * Suchmaschinen-Autoritaet + Newsletter-Leads auf. Voll statisch (lib/ratgeber.ts).
 */

const baseUrl = `https://${tropfshopBrand.domains.de}`;

export const metadata: Metadata = {
  title: "Ratgeber Tropfbewässerung — Tipps von Gärtnern für Gärtner",
  description:
    "Technisch fundierte Anleitungen rund um Tropfbewässerung: Hochbeet planen, Tomaten bewässern, Druckminderer wählen. Verständlich erklärt, ohne Marketing-Geschwurbel.",
  alternates: { canonical: "/ratgeber" },
  openGraph: {
    title: "Ratgeber Tropfbewässerung — Tropfshop",
    description:
      "Technisch fundierte Anleitungen rund um Tropfbewässerung für Garten und Klein-Gewerbe.",
    url: `${baseUrl}/ratgeber`,
    type: "website",
  },
  // Ratgeber wird bereits in Phase 1 indexiert (Override des Layout-noindex).
  robots: { index: true, follow: true },
};

export default function RatgeberIndexPage() {
  const articles = getAllRatgeberArticles();

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: articles.map((article, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: article.title,
      url: `${baseUrl}/ratgeber/${article.slug}`,
    })),
  };

  return (
    <PageShell>
      <JsonLd data={itemListJsonLd} />

      <div className="mx-auto w-full max-w-3xl px-6 py-12 sm:py-16">
        <nav aria-label="Brotkrumen" className="mb-6 text-sm text-neutral-400">
          <Link href="/" className="hover:text-accent">
            Start
          </Link>{" "}
          <span aria-hidden>/</span>{" "}
          <span className="text-neutral-200">Ratgeber</span>
        </nav>

        <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          Ratgeber Tropfbewässerung
        </h1>
        <p className="mt-4 max-w-2xl text-pretty leading-relaxed text-neutral-300">
          Technisch fundierte Anleitungen für Garten und Klein-Gewerbe —
          verständlich erklärt, von der Planung bis zur passenden Komponente.
        </p>

        <ul className="mt-12 flex flex-col gap-4">
          {articles.map((article) => (
            <li key={article.slug}>
              <Link
                href={`/ratgeber/${article.slug}`}
                className="group block rounded-2xl border border-white/10 bg-white/[0.02] p-6 transition hover:border-accent/40 hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
              >
                <h2 className="text-lg font-semibold leading-snug text-neutral-100 group-hover:text-accent">
                  {article.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-neutral-400">
                  {article.description}
                </p>
                <span className="mt-3 inline-block text-xs uppercase tracking-wide text-neutral-400">
                  {article.readingMinutes} Min. Lesezeit
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </PageShell>
  );
}

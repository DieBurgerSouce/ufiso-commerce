import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { tropfshopBrand } from "@ufiso/shop-config/tropfshop";
import { PageShell } from "@/components/page-shell";
import { JsonLd } from "@/components/json-ld";
import { NewsletterForm } from "@/components/newsletter-form";
import {
  categoryLabel,
  getRatgeberArticle,
  ratgeberSlugs,
} from "@/lib/ratgeber";

/**
 * Ratgeber-Artikel (/ratgeber/[slug]) — voll statisch, INDEXIERBAR.
 *
 * `generateStaticParams` rendert alle Artikel zur Build-Zeit vor (kein Backend
 * noetig). Article- + FAQPage- + BreadcrumbList-JSON-LD fuer Rich Results.
 */

const baseUrl = `https://${tropfshopBrand.domains.de}`;

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams(): { slug: string }[] {
  return ratgeberSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = getRatgeberArticle(slug);

  if (!article) {
    return {
      title: `Ratgeber nicht gefunden — ${tropfshopBrand.name}`,
      robots: { index: false, follow: false },
    };
  }

  return {
    title: `${article.title} — ${tropfshopBrand.name}`,
    description: article.description,
    alternates: { canonical: `/ratgeber/${article.slug}` },
    openGraph: {
      title: article.title,
      description: article.description,
      url: `${baseUrl}/ratgeber/${article.slug}`,
      type: "article",
    },
    robots: { index: true, follow: true },
  };
}

export default async function RatgeberArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = getRatgeberArticle(slug);

  if (!article) {
    notFound();
  }

  const articleUrl = `${baseUrl}/ratgeber/${article.slug}`;

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    datePublished: article.updatedAt,
    dateModified: article.updatedAt,
    author: {
      "@type": "Organization",
      name: tropfshopBrand.name,
    },
    publisher: {
      "@type": "Organization",
      name: tropfshopBrand.legalName,
    },
    mainEntityOfPage: articleUrl,
    url: articleUrl,
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: article.faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { name: "Start", url: `${baseUrl}/` },
      { name: "Ratgeber", url: `${baseUrl}/ratgeber` },
      { name: article.title, url: articleUrl },
    ].map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <PageShell>
      <JsonLd data={articleJsonLd} />
      {article.faq.length > 0 && <JsonLd data={faqJsonLd} />}
      <JsonLd data={breadcrumbJsonLd} />

      <article className="mx-auto w-full max-w-3xl px-6 py-12 sm:py-16">
        <nav aria-label="Brotkrumen" className="mb-6 text-sm text-neutral-400">
          <Link href="/" className="hover:text-accent">
            Start
          </Link>{" "}
          <span aria-hidden>/</span>{" "}
          <Link href="/ratgeber" className="hover:text-accent">
            Ratgeber
          </Link>{" "}
          <span aria-hidden>/</span>{" "}
          <span className="text-neutral-200">{article.title}</span>
        </nav>

        <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          {article.title}
        </h1>
        <p className="mt-3 text-xs uppercase tracking-wide text-neutral-500">
          {article.readingMinutes} Min. Lesezeit
        </p>
        <p className="mt-6 text-pretty text-lg leading-relaxed text-neutral-300">
          {article.intro}
        </p>

        <div className="mt-10 flex flex-col gap-10">
          {article.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
                {section.heading}
              </h2>
              <div className="mt-3 flex flex-col gap-3">
                {section.paragraphs.map((paragraph, index) => (
                  <p
                    key={index}
                    className="text-pretty leading-relaxed text-neutral-300"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        {article.faq.length > 0 && (
          <section className="mt-12" aria-labelledby="faq-heading">
            <h2
              id="faq-heading"
              className="text-xl font-semibold tracking-tight sm:text-2xl"
            >
              Häufige Fragen
            </h2>
            <dl className="mt-4 flex flex-col gap-5">
              {article.faq.map((item) => (
                <div key={item.question}>
                  <dt className="font-medium text-neutral-100">
                    {item.question}
                  </dt>
                  <dd className="mt-1 leading-relaxed text-neutral-400">
                    {item.answer}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {article.relatedCategoryHandles.length > 0 && (
          <section className="mt-12" aria-labelledby="related-heading">
            <h2
              id="related-heading"
              className="text-base font-semibold tracking-tight text-neutral-200"
            >
              Passende Produkte im Sortiment
            </h2>
            <ul className="mt-3 flex flex-wrap gap-3">
              {article.relatedCategoryHandles.map((handle) => (
                <li key={handle}>
                  <Link
                    href={`/produkte/kategorie/${handle}`}
                    className="inline-flex rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm text-neutral-200 transition hover:border-accent/40 hover:text-accent"
                  >
                    {categoryLabel(handle)}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="mt-12 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <h2 className="text-lg font-semibold tracking-tight">
            Zum Launch benachrichtigt werden
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-neutral-400">
            Wir bauen gerade. Tragen Sie sich ein und sichern Sie sich
            10&nbsp;% Frühbucher-Rabatt auf Ihre erste Bestellung.
          </p>
          <div className="mt-6 max-w-md">
            <NewsletterForm />
          </div>
        </div>

        <p className="mt-10 text-sm">
          <Link
            href="/ratgeber"
            className="text-accent underline underline-offset-4 hover:text-accent/80"
          >
            ← Alle Ratgeber-Artikel
          </Link>
        </p>
      </article>
    </PageShell>
  );
}

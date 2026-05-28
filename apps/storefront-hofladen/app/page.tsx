import Link from "next/link";
import { hofladenBrand } from "@ufiso/shop-config/hofladen";
import { ComingSoonTiles } from "@/components/coming-soon-tiles";
import { NewsletterForm } from "@/components/newsletter-form";
import { CookieSettingsButton } from "@/components/cookie-settings-button";
import { pingMedusaConnection } from "@/lib/medusa-smoke";

export default async function ComingSoonPage() {
  await pingMedusaConnection();

  const year = new Date().getFullYear();

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-neutral-950 text-neutral-100">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60rem_40rem_at_70%_-10%,rgb(var(--color-primary)/0.35),transparent),radial-gradient(50rem_30rem_at_10%_110%,rgb(var(--color-accent)/0.20),transparent)]"
      />

      <div className="relative mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 py-20">
        <p className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-sm font-medium text-neutral-300">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          {hofladenBrand.name} — Sortiment in Vorbereitung
        </p>

        <h1 className="text-balance text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          {hofladenBrand.name}: regionale Lebensmittel{" "}
          <span className="text-accent">vom Hof in Ihren Haushalt</span>.
        </h1>

        <p className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-neutral-300">
          {hofladenBrand.meta.defaultDescription} Tragen Sie sich ein und
          erfahren Sie als Erste, sobald wir starten.
        </p>

        <div className="mt-10 max-w-md">
          <NewsletterForm />
        </div>

        <ul className="mt-12 flex flex-wrap gap-x-8 gap-y-3 text-sm text-neutral-400">
          <li>Vorbereitung im Bergischen</li>
          <li>Sortiment + Liefergebiete folgen</li>
          <li>Pre-Launch — keine Bestellung moeglich</li>
        </ul>
      </div>

      <ComingSoonTiles />

      <footer className="relative border-t border-white/10 px-6 py-6">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 text-xs text-neutral-500">
          <nav
            aria-label="Rechtliches"
            className="flex flex-wrap gap-x-5 gap-y-2"
          >
            <Link
              className="underline underline-offset-2 hover:text-neutral-300"
              href="/datenschutz"
            >
              Datenschutz
            </Link>
            <Link
              className="underline underline-offset-2 hover:text-neutral-300"
              href="/impressum"
            >
              Impressum
            </Link>
            <CookieSettingsButton />
          </nav>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <span>
              © {year} {hofladenBrand.legalName} — {hofladenBrand.name}
            </span>
            <span>
              Kontakt:{" "}
              <a
                className="underline underline-offset-2 hover:text-neutral-300"
                href={`mailto:${hofladenBrand.contact.email}`}
              >
                {hofladenBrand.contact.email}
              </a>
            </span>
          </div>
        </div>
      </footer>
    </main>
  );
}

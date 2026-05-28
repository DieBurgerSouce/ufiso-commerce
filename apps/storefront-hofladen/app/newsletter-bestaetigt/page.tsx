import type { Metadata } from "next";
import Link from "next/link";
import { hofladenBrand } from "@ufiso/shop-config/hofladen";

export const metadata: Metadata = {
  title: `Anmeldung bestätigt – ${hofladenBrand.name}`,
  description:
    "Vielen Dank — Ihre Newsletter-Anmeldung ist bestätigt. Wir melden uns, sobald der Hofladen startet.",
  robots: { index: false, follow: false },
};

export default function NewsletterBestaetigtPage() {
  const year = new Date().getFullYear();

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-neutral-950 text-neutral-100">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60rem_40rem_at_70%_-10%,rgb(var(--color-primary)/0.35),transparent),radial-gradient(50rem_30rem_at_10%_110%,rgb(var(--color-accent)/0.20),transparent)]"
      />

      <div className="relative mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 py-20">
        <p className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-sm font-medium text-neutral-200">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          Newsletter bestätigt
        </p>

        <h1 className="text-balance text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          Anmeldung bestätigt — <span className="text-accent">danke!</span>
        </h1>

        <p className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-neutral-300">
          Sie sind jetzt für den {hofladenBrand.name}-Newsletter eingetragen.
          Wir melden uns, sobald wir starten.
        </p>

        <div className="mt-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-neutral-100 transition hover:border-accent/50 hover:bg-accent/10 focus:outline-none focus:ring-2 focus:ring-accent/40"
          >
            ← Zurück zur Startseite
          </Link>
        </div>
      </div>

      <footer className="relative border-t border-white/10 px-6 py-6">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-1 text-xs text-neutral-500 sm:flex-row sm:items-center sm:justify-between">
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
      </footer>
    </main>
  );
}

import { tropfshopBrand } from "@ufiso/shop-config/tropfshop";
import { NewsletterForm } from "@/components/newsletter-form";

export default function ComingSoonPage() {
  const year = new Date().getFullYear();

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-neutral-950 text-neutral-100">
      {/* Hintergrund-Akzent */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60rem_40rem_at_70%_-10%,rgb(var(--color-primary)/0.35),transparent),radial-gradient(50rem_30rem_at_10%_110%,rgb(var(--color-accent)/0.20),transparent)]"
      />

      <div className="relative mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 py-20">
        <p className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-sm font-medium text-neutral-300">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          Launch geplant für März 2027
        </p>

        <h1 className="text-balance text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          Der erste Spezialist-Shop für{" "}
          <span className="text-accent">Tropfbewässerung</span> in DACH.
        </h1>

        <p className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-neutral-300">
          {tropfshopBrand.name} bringt Ihnen durchdachte Tropfbewässerung für
          Garten und Klein-Gewerbe — technisch fundiert beraten, fair bepreist.
          Wir bauen gerade. Tragen Sie sich ein und sichern Sie sich{" "}
          <strong className="font-semibold text-neutral-100">
            10&nbsp;% Frühbucher-Rabatt
          </strong>{" "}
          auf Ihre erste Bestellung.
        </p>

        <div className="mt-10 max-w-md">
          <NewsletterForm />
        </div>

        <ul className="mt-12 flex flex-wrap gap-x-8 gap-y-3 text-sm text-neutral-400">
          <li>Versand aus Solingen</li>
          <li>Beratung von Gärtnern für Gärtner</li>
          <li>Lieferung nach DE &amp; AT</li>
        </ul>
      </div>

      <footer className="relative border-t border-white/10 px-6 py-6">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-1 text-xs text-neutral-500 sm:flex-row sm:items-center sm:justify-between">
          <span>
            © {year} {tropfshopBrand.legalName} — {tropfshopBrand.name}
          </span>
          <span>
            Kontakt:{" "}
            <a
              className="underline underline-offset-2 hover:text-neutral-300"
              href={`mailto:${tropfshopBrand.contact.email}`}
            >
              {tropfshopBrand.contact.email}
            </a>
          </span>
        </div>
      </footer>
    </main>
  );
}

import Link from "next/link";
import { tropfshopBrand } from "@ufiso/shop-config/tropfshop";
import { CookieSettingsButton } from "@/components/cookie-settings-button";

/**
 * Gemeinsames Seiten-Chrome (Header + Footer) fuer die Inhaltsseiten
 * (/produkte, /ratgeber). Die Coming-Soon-Landingpage (app/page.tsx) behaelt
 * bewusst ihr eigenes, fokussiertes Layout.
 *
 * Server Components; nur der CookieSettingsButton ist client-seitig.
 */

function SiteHeader() {
  return (
    <header className="relative z-10 border-b border-white/10">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-5">
        <Link
          href="/"
          className="text-sm font-semibold tracking-tight text-neutral-100 transition hover:text-accent"
        >
          {tropfshopBrand.name}
        </Link>
        <nav
          aria-label="Hauptnavigation"
          className="flex gap-x-6 text-sm text-neutral-300"
        >
          <Link href="/produkte" className="transition hover:text-accent">
            Sortiment
          </Link>
          <Link href="/ratgeber" className="transition hover:text-accent">
            Ratgeber
          </Link>
        </nav>
      </div>
    </header>
  );
}

function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="relative mt-auto border-t border-white/10 px-6 py-6">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 text-xs text-neutral-500">
        <nav aria-label="Rechtliches" className="flex flex-wrap gap-x-5 gap-y-2">
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
      </div>
    </footer>
  );
}

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col bg-neutral-950 text-neutral-100">
      <SiteHeader />
      <main className="relative flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}

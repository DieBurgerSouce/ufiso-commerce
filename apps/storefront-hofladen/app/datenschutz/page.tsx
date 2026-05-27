import type { Metadata } from "next";
import Link from "next/link";
import { hofladenBrand, hofladenLegal } from "@ufiso/shop-config/hofladen";
import { CookieSettingsButton } from "@/components/cookie-settings-button";

export const metadata: Metadata = {
  title: `Datenschutz · ${hofladenBrand.name}`,
  description:
    "Vorlaeufige Datenschutzerklaerung Hofladen. Finale Fassung mit UFISO-Gruendungsdaten folgt vor Public-Launch.",
  robots: {
    index: true,
    follow: true,
  },
};

/**
 * Datenschutz-Stub Hofladen (Phase 1 + Sprint-11-FUNKTIONALER-Stresstest).
 * Inhalt analog Tropfshop, mit Hofladen-Brand-Strings. Finaler Text vom
 * Haendlerbund kommt vor Launch.
 */
export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold leading-tight">
        Datenschutzerklaerung
      </h1>
      <p className="mt-2 text-sm text-neutral-500">
        Stand Pre-Launch — die finale Fassung wird vor dem oeffentlichen
        Start veroeffentlicht.
      </p>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-semibold">Verantwortlich</h2>
        <p>
          {hofladenLegal.companyName} {hofladenLegal.legalForm} (in Gruendung),{" "}
          {hofladenLegal.address.city}, {hofladenLegal.address.country}.
        </p>
        <p>
          Kontakt:{" "}
          <a className="underline" href={`mailto:${hofladenLegal.contactEmail}`}>
            {hofladenLegal.contactEmail}
          </a>
        </p>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-semibold">Welche Daten wir in Phase 1 verarbeiten</h2>
        <p>
          Diese Seite ist eine Pre-Launch-Seite ohne Shop-Funktion. Wir
          verarbeiten ausschliesslich:
        </p>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong>Newsletter-Anmeldung</strong> ueber Brevo (EU-Server,
            Sendinblue SAS, Paris) im Double-Opt-In-Verfahren.
          </li>
          <li>
            <strong>Server-Logs</strong> (anonyme Aufruf-Metadaten, ohne
            IP-Speicherung) zur Betriebssicherheit. Berechtigtes Interesse
            nach Art. 6 Abs. 1 lit. f DSGVO.
          </li>
          <li>
            <strong>Fehler-Telemetrie</strong> (BetterStack, Frankfurt) —
            nur nach Ihrer aktiven Einwilligung im Cookie-Banner. Inhalt:
            Stack-Traces und betroffene URL. Keine IP-Adresse, keine
            Eingaben aus Formularen.
          </li>
        </ul>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-semibold">Cookies und Einwilligungen</h2>
        <p>
          Wir setzen ausschliesslich einen technisch erforderlichen Cookie
          (Ihre Auswahl im Cookie-Banner). Alle weiteren Dienste sind
          opt-in.
        </p>
        <p>Ihre Einstellungen koennen Sie jederzeit anpassen:</p>
        <CookieSettingsButton variant="primary" />
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-semibold">Ihre Rechte</h2>
        <p>
          Sie haben das Recht auf Auskunft, Berichtigung, Loeschung,
          Einschraenkung der Verarbeitung, Datenuebertragbarkeit und
          Widerspruch. Eine Beschwerde koennen Sie bei der Landesbeauftragten
          fuer Datenschutz NRW einreichen.
        </p>
        <p>
          Anfragen bitte an:{" "}
          <a className="underline" href={`mailto:${hofladenLegal.contactEmail}`}>
            {hofladenLegal.contactEmail}
          </a>
        </p>
      </section>

      <p className="mt-12 text-sm text-neutral-500">
        Zurueck zur <Link className="underline" href="/">Startseite</Link>.
      </p>
    </main>
  );
}

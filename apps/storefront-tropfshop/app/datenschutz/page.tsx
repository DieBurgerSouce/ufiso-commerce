import type { Metadata } from "next";
import Link from "next/link";
import { tropfshopBrand, tropfshopLegal } from "@ufiso/shop-config/tropfshop";
import { CookieSettingsButton } from "@/components/cookie-settings-button";

export const metadata: Metadata = {
  title: `Datenschutz · ${tropfshopBrand.name}`,
  description:
    "Vorlaeufige Datenschutzerklaerung Tropfshop. Finale Fassung mit UFISO-Gruendungsdaten folgt vor Public-Launch.",
  robots: {
    index: true,
    follow: true,
  },
};

/**
 * Datenschutz-Stub (Phase 1).
 *
 * Die finale Datenschutzerklaerung kommt vom Haendlerbund vor Launch
 * (Vault: 03-Recht-und-Compliance/Rechtstexte-AGB-Widerruf.md) — bis dahin
 * steht hier die Pre-Launch-Variante, die zwingend abdecken muss:
 *  - Verantwortlicher (UFISO GmbH i. Gr.)
 *  - Welche Daten in Phase 1 verarbeitet werden (Newsletter-DOI, anonyme
 *    Fehler-Telemetrie nach Opt-in)
 *  - Hinweis auf das Cookie-Banner (Klaro) inkl. erneutem Aufruf
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
          {tropfshopLegal.companyName} {tropfshopLegal.legalForm} (in
          Gruendung), {tropfshopLegal.address.city},{" "}
          {tropfshopLegal.address.country}.
        </p>
        <p>
          Kontakt:{" "}
          <a className="underline" href={`mailto:${tropfshopLegal.contactEmail}`}>
            {tropfshopLegal.contactEmail}
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
            Sendinblue SAS, Paris). Sie geben Ihre E-Mail-Adresse aktiv ein
            und bestaetigen die Anmeldung per Double-Opt-in-Mail. Wir
            speichern die Adresse, bis Sie sich abmelden.
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
        <p>
          Ihre Einstellungen koennen Sie jederzeit anpassen:
        </p>
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
          <a className="underline" href={`mailto:${tropfshopLegal.contactEmail}`}>
            {tropfshopLegal.contactEmail}
          </a>
        </p>
      </section>

      <p className="mt-12 text-sm text-neutral-500">
        Zurueck zur <Link className="underline" href="/">Startseite</Link>.
      </p>
    </main>
  );
}

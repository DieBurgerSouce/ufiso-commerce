import type { Metadata } from "next";
import Link from "next/link";
import { tropfshopBrand, tropfshopLegal } from "@ufiso/shop-config/tropfshop";

export const metadata: Metadata = {
  title: `Impressum · ${tropfshopBrand.name}`,
  description:
    "Impressum Tropfshop. Endgueltige Fassung mit Handelsregister und USt-IdNr. folgt nach UFISO-Gruendung.",
  robots: {
    index: true,
    follow: true,
  },
};

/**
 * Impressum-Stub (Phase 1).
 *
 * UFISO GmbH ist in Gruendung — Handelsregisternummer, USt-IdNr. und
 * Geschaeftsfuehrer-Angaben sind hier `TBD`, bis die Gruendung beim Notar
 * erledigt ist. Vor Public-Launch wird der Stub durch die finalen Werte
 * aus `tropfshopLegal` ersetzt (kommt aus `@ufiso/shop-config`).
 */
export default function ImprintPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold leading-tight">Impressum</h1>
      <p className="mt-2 text-sm text-neutral-500">
        Vorlaeufige Angaben — final nach UFISO-Gruendung.
      </p>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-semibold">Anbieter</h2>
        <p>
          {tropfshopLegal.companyName} {tropfshopLegal.legalForm} (in
          Gruendung)
          <br />
          {tropfshopLegal.address.street}
          <br />
          {tropfshopLegal.address.zip} {tropfshopLegal.address.city}
          <br />
          {tropfshopLegal.address.country}
        </p>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-semibold">Vertretungsberechtigt</h2>
        <p>{tropfshopLegal.managingDirectors.join(", ")}</p>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-semibold">Kontakt</h2>
        <p>
          E-Mail:{" "}
          <a className="underline" href={`mailto:${tropfshopLegal.contactEmail}`}>
            {tropfshopLegal.contactEmail}
          </a>
        </p>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-semibold">Handelsregister</h2>
        <p>
          {tropfshopLegal.registerCourt ?? "TBD — Eintragung nach Gruendung"}
          {tropfshopLegal.registerNumber
            ? `, ${tropfshopLegal.registerNumber}`
            : ""}
        </p>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-semibold">Umsatzsteuer-ID</h2>
        <p>{tropfshopLegal.vatId ?? "TBD — Beantragung nach Gruendung"}</p>
      </section>

      <p className="mt-12 text-sm text-neutral-500">
        Zurueck zur <Link className="underline" href="/">Startseite</Link>.
      </p>
    </main>
  );
}

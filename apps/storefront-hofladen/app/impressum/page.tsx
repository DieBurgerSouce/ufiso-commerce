import type { Metadata } from "next";
import Link from "next/link";
import { hofladenBrand, hofladenLegal } from "@ufiso/shop-config/hofladen";

export const metadata: Metadata = {
  title: `Impressum · ${hofladenBrand.name}`,
  description:
    "Impressum Hofladen. Endgueltige Fassung mit Handelsregister und USt-IdNr. folgt nach UFISO-Gruendung.",
  robots: {
    index: true,
    follow: true,
  },
};

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
          {hofladenLegal.companyName} {hofladenLegal.legalForm} (in
          Gruendung)
          <br />
          {hofladenLegal.address.street}
          <br />
          {hofladenLegal.address.zip} {hofladenLegal.address.city}
          <br />
          {hofladenLegal.address.country}
        </p>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-semibold">Vertretungsberechtigt</h2>
        <p>{hofladenLegal.managingDirectors.join(", ")}</p>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-semibold">Kontakt</h2>
        <p>
          E-Mail:{" "}
          <a className="underline" href={`mailto:${hofladenLegal.contactEmail}`}>
            {hofladenLegal.contactEmail}
          </a>
        </p>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-semibold">Handelsregister</h2>
        <p>
          {hofladenLegal.registerCourt ?? "TBD — Eintragung nach Gruendung"}
          {hofladenLegal.registerNumber
            ? `, ${hofladenLegal.registerNumber}`
            : ""}
        </p>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-semibold">Umsatzsteuer-ID</h2>
        <p>{hofladenLegal.vatId ?? "TBD — Beantragung nach Gruendung"}</p>
      </section>

      <p className="mt-12 text-sm text-neutral-500">
        Zurueck zur <Link className="underline" href="/">Startseite</Link>.
      </p>
    </main>
  );
}

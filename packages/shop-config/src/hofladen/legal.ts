import type { LegalConfig } from "../types";

/**
 * Rechts-/Impressumsdaten Hofladen (Betreiber: UFISO GmbH).
 *
 * Stub-Status — identisch zur Tropfshop-Legal-Datei: UFISO GmbH ist in
 * Gruendung, Handelsregister/USt-IdNr./Geschaeftsfuehrer noch TBD. Beide
 * Shops teilen die Trägergesellschaft (ein Sales Channel pro Shop, vgl.
 * ADR-002), darum sind die rechtlichen Felder identisch. Rechtstexte
 * (AGB, Widerruf) kommen weiterhin vom Haendlerbund.
 */
export const hofladenLegal: LegalConfig = {
  companyName: "UFISO",
  legalForm: "GmbH",
  address: {
    street: "TBD",
    zip: "42xxx",
    city: "Solingen",
    country: "Deutschland",
  },
  registerCourt: null,
  registerNumber: null,
  vatId: null,
  managingDirectors: ["Benjamin Firmenich"],
  contactEmail: "service@hofladen-shop.de",
};

import type { LegalConfig } from "../types";

/**
 * Rechts-/Impressumsdaten Tropfshop (Betreiber: UFISO GmbH).
 *
 * ACHTUNG: UFISO GmbH ist in Gruendung — Handelsregister, USt-IdNr. und
 * Geschaeftsfuehrer-Eintrag sind TBD. Rechtstexte selbst kommen vom
 * Haendlerbund (Vault: 03-Recht-und-Compliance/Rechtstexte-AGB-Widerruf.md).
 */
export const tropfshopLegal: LegalConfig = {
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
  contactEmail: "service@tropfshop.de",
};

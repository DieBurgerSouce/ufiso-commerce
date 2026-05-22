/**
 * Typen fuer die Brand-Konfiguration eines UFISO-Shops.
 * Jeder Shop (Tropfshop, Hofladen, ...) liefert ein Objekt vom Typ `BrandConfig`.
 * Siehe Vault: 02-Architektur/Branding-Konfiguration.md
 */

/** RGB-Tripel als String "R G B" — direkt fuer Tailwind/CSS-Variablen nutzbar. */
export type RgbTriplet = `${number} ${number} ${number}`;

export interface ColorScale {
  /** Index-Signatur — macht die Skala kompatibel zu Tailwinds Farbtyp. */
  [shade: string]: string;
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  950: string;
}

export interface BrandColors {
  /** Primaerfarbe (Hex). */
  primary: string;
  /** Akzentfarbe (Hex). */
  accent: string;
  /** Neutrale Graustufen-Skala. */
  neutral: ColorScale;
}

export interface BrandDomains {
  de: string;
  at: string;
  ch: string;
}

export interface BrandConfig {
  /** Slug — entspricht dem Medusa Sales Channel. */
  slug: string;
  /** Anzeigename des Shops. */
  name: string;
  /** Juristischer Betreiber. */
  legalName: string;
  domains: BrandDomains;
  colors: BrandColors;
  fonts: {
    display: string;
    body: string;
  };
  logo: {
    light: string;
    dark: string;
    favicon: string;
  };
  meta: {
    defaultTitle: string;
    defaultDescription: string;
    socialImage: string;
  };
  contact: {
    email: string;
    phone: string | null;
  };
  social: {
    instagram: string | null;
    youtube: string | null;
    facebook: string | null;
  };
}

/** Impressums-/Rechtsdaten eines Shops. Siehe Vault: 03-Recht-und-Compliance. */
export interface LegalConfig {
  companyName: string;
  /** Rechtsform-Zusatz, z. B. "GmbH". */
  legalForm: string;
  address: {
    street: string;
    zip: string;
    city: string;
    country: string;
  };
  /** Handelsregister-Nummer — TBD bis UFISO-Gruendung abgeschlossen. */
  registerCourt: string | null;
  registerNumber: string | null;
  /** USt-IdNr. — TBD bis Gruendung. */
  vatId: string | null;
  managingDirectors: string[];
  contactEmail: string;
}

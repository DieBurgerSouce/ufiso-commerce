import type { Config } from "tailwindcss";
import { tropfshopBrand } from "@ufiso/shop-config/tropfshop";

const { colors, fonts } = tropfshopBrand;

/**
 * Tailwind-Preset Tropfshop.
 *
 * Brand-Tokens kommen aus `@ufiso/shop-config` (Single Source of Truth) —
 * so wird beim Klonen eines neuen Shops nur die shop-config getauscht.
 * Siehe Vault: 02-Architektur/Branding-Konfiguration.md
 *
 * Verwendung im Storefront:
 *   import tropfshopPreset from "@ufiso/tailwind-config/tropfshop";
 *   export default { presets: [tropfshopPreset], content: [...] };
 */
const preset = {
  theme: {
    extend: {
      colors: {
        primary: colors.primary,
        accent: colors.accent,
        neutral: colors.neutral,
      },
      fontFamily: {
        display: [fonts.display, "system-ui", "sans-serif"],
        sans: [fonts.body, "system-ui", "sans-serif"],
      },
    },
  },
} satisfies Omit<Config, "content">;

export default preset;

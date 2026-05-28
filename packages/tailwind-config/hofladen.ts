import type { Config } from "tailwindcss";
import { hofladenBrand } from "@ufiso/shop-config/hofladen";

const { colors, fonts } = hofladenBrand;

/**
 * Tailwind-Preset Hofladen (Sprint 11 C.3 — FUNKTIONALER Stresstest).
 *
 * Identische Struktur wie tropfshop.ts — Brand-Tokens kommen aus
 * `@ufiso/shop-config/hofladen`. Beim Klonen eines neuen Shops bleibt
 * dies das Boilerplate: ein Token-Pull aus shop-config, das war's.
 *
 * Visuelles Polishing (Hero-Bilder, custom Display-Font, finale Palette)
 * ist Sprint 12 nach Vater-Termin.
 *
 * Verwendung:
 *   import hofladenPreset from "@ufiso/tailwind-config/hofladen";
 *   export default { presets: [hofladenPreset], content: [...] };
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

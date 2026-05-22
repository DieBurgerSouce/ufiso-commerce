import type { Config } from "tailwindcss";
import tropfshopPreset from "@ufiso/tailwind-config/tropfshop";

/**
 * Tailwind-Config Tropfshop-Storefront.
 * Brand-Tokens kommen aus dem geteilten Preset (@ufiso/tailwind-config).
 */
export default {
  presets: [tropfshopPreset],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
} satisfies Config;

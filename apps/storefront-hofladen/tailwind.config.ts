import type { Config } from "tailwindcss";
import hofladenPreset from "@ufiso/tailwind-config/hofladen";

/**
 * Tailwind-Config Hofladen-Storefront.
 * Brand-Tokens kommen aus dem geteilten Preset (@ufiso/tailwind-config).
 */
export default {
  presets: [hofladenPreset],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
} satisfies Config;

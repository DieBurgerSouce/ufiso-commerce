import nextConfig from "@ufiso/eslint-config/next";

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...nextConfig,
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "playwright-report/**",
      // Auto-generiert von Next.js (Hofladen-Storefront, Sprint 11 — analog
      // Tropfshop). Triple-Slash-Reference darf nicht editiert werden.
      "next-env.d.ts",
    ],
  },
];

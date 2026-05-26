import nextConfig from "@ufiso/eslint-config/next";

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...nextConfig,
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "playwright-report/**",
      // Auto-generiert von Next.js (siehe nextjs.org/docs/.../typescript).
      // Seit Next 15.5 enthaelt die Datei einen dritten triple-slash
      // `<reference path="./.next/types/routes.d.ts" />`, der
      // @typescript-eslint/triple-slash-reference verletzt. Datei darf
      // nicht editiert werden -- Ignore ist der vorgesehene Weg.
      "next-env.d.ts",
    ],
  },
];

import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

/**
 * Geteilte ESLint-Flat-Config (Basis) fuer UFISO-Packages.
 * @type {import("eslint").Linter.Config[]}
 */
export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    ignores: ["dist/**", ".next/**", ".medusa/**", "node_modules/**"],
  },
];

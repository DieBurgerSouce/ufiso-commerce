# ADR-006 — Monorepo-Scaffold & Tooling-Entscheidungen

**Status:** accepted · **Datum:** 2026-05-22

> Stub. Langfassung inkl. Alternativen & Konsequenzen im Vault:
> `07-ADRs/ADR-006-Monorepo-Scaffold-Tooling.md`

Beim erstmaligen Aufsetzen des Monorepos getroffene Entscheidungen:

1. **Medusa-Backend** durch Klon von `medusa-starter-default` (v2.15.3),
   nicht via interaktivem `create-medusa-app`.
2. **pnpm:** isolierter Default-Linker + `publicHoistPattern` für
   `@medusajs/*` (damit `medusa build` transitive Plugins findet) statt
   `nodeLinker: hoisted` — letzteres duplizierte React und brach das
   Storefront-SSR. `strict-peer-dependencies=false` (Abweichung von der
   Vault-Vorgabe). Konfig in `pnpm-workspace.yaml`.
3. **Tailwind CSS v3** für das geteilte `packages/tailwind-config`-Preset.
4. **`odoo-sync`** ist ein Medusa-Modul (`apps/backend/src/modules/`),
   kein Top-Level-Package.
5. **Newsletter** via Brevo Double-Opt-In-Endpoint in einer eigenen
   Next.js-Route — kein Brevo-Embed.
6. **`packages/ui` / `packages/medusa-client`** vorerst nicht angelegt
   (kein Sprint-Scope, Anti-Overengineering).
7. **CI Sprint 1:** `turbo lint typecheck build` + Playwright-Smoke;
   Pflicht-Launch-Flows als `test.fixme`-Stubs.

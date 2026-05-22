# CLAUDE.md — UFISO Commerce Monorepo

Projekt-Kontext für Claude Code / Cursor. **Source of Truth für Strategie,
Recht und Architektur ist der UFISO-Vault** (`~/Obsidian/Storage/_UFISO/`,
Obsidian) — bei strukturellen Entscheidungen dort `CLAUDE.md` und `07-ADRs/`
lesen, bevor implementiert wird.

## Was ist das

Multi-Shop-E-Commerce-Monorepo der **UFISO GmbH** (in Gründung, Solingen).
Erster Shop: **Tropfshop** (Tropfbewässerung DACH), Public Launch 1. März 2027.
Solo-Gründer, 8–15 h/Woche → **Anti-Overengineering, working > perfect.**

Weitere Shops (Hofladen, Folien) werden später als Klone ergänzt — daher
Multi-Brand-Architektur ab Tag 1.

## Stack (entschieden, siehe Vault `07-ADRs/`)

- **Medusa.js v2** Headless-Backend — ein Sales Channel pro Shop (ADR-002)
- **Next.js 15** App Router für Storefronts
- **Turborepo + pnpm** Monorepo (ADR-004)
- **PostgreSQL** — lokal Docker, Prod Neon EU
- **Odoo 18.0 = SoT fürs Inventar** (ADR-003), Sync via `odoo-sync`-Modul
- **TypeScript strikt**, **Tailwind v3** mit Brand-Tokens aus `shop-config`

## Struktur

```
apps/
  backend/               Medusa v2 (Sales Channel tropfshop, Region DE/AT)
  storefront-tropfshop/  Next.js 15 — Phase 1: Pre-Launch-Page + Brevo
  docs/                  ADR-Stubs + Runbooks (Langfassung im Vault)
packages/
  tsconfig/              geteilte tsconfig-Basis
  eslint-config/         geteilte ESLint-Flat-Config
  tailwind-config/       Brand-Presets (Multi-Brand)
  shop-config/           Brand-/Legal-Config pro Shop (SoT für Branding)
```

`packages/ui` und `packages/medusa-client` folgen, sobald gebraucht.

## Befehle

```bash
docker compose up -d                 # lokale Postgres + Redis
pnpm install
pnpm --filter @ufiso/backend db:migrate
pnpm --filter @ufiso/backend seed    # legt Sales Channel + Regionen an
pnpm dev                             # alle Apps (Backend :9000, Storefront :3000)
pnpm lint && pnpm typecheck && pnpm build
```

## Konventionen

- **Conventional Commits**: `feat:`, `fix:`, `chore:`, `docs:`
- Kleine PRs mit klarem Scope, Squash & Merge nach `main`
- **ADR schreiben, bevor implementiert wird** bei strukturellen Entscheidungen
  (Template: Vault `07-ADRs/Template-ADR.md`)
- **Frag nach statt zu raten** bei strategischen Fragen
- Server Components als Default, Client Components nur wo nötig
- Secrets nie committen — siehe Vault `Secrets-Management.md`

## Tonalität für generierten Content (Tropfshop)

Technisch fundiert, kein Marketing-Geschwurbel. Hilfsbereit, klar, deutsch,
**Sie-Anrede**.

## Nicht im Stack (bewusst)

Shopware, Saleor, WooCommerce, Shopify, Multi-Store-Plugin, Algolia, Datadog,
Sentry SaaS, Klarna B2B (→ Billie).

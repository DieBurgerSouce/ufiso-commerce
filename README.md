# UFISO Commerce

Multi-Shop-E-Commerce-Monorepo der UFISO GmbH. Erster Shop: **Tropfshop**
(Tropfbewässerung DACH) — Public Launch 1. März 2027.

## Voraussetzungen

- Node.js 22 (`.nvmrc`)
- pnpm 11 (`corepack enable`)
- Docker (lokale Postgres + Redis)

## Schnellstart

```bash
# 1. Infrastruktur
docker compose up -d

# 2. Abhängigkeiten
pnpm install

# 3. Backend einrichten
cp apps/backend/.env.template apps/backend/.env
pnpm --filter @ufiso/backend db:migrate
pnpm --filter @ufiso/backend seed        # Sales Channel + Regionen + API-Key

# 4. Storefront-Env
cp apps/storefront-tropfshop/.env.local.template apps/storefront-tropfshop/.env.local
#   -> NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY aus der Seed-Ausgabe eintragen

# 5. Entwicklung
pnpm dev
```

| App                          | URL                          |
| ----------------------------- | ---------------------------- |
| Medusa Backend / Admin         | http://localhost:9000/app    |
| Storefront Tropfshop           | http://localhost:3000        |

## Monorepo

| Workspace                       | Zweck                                    |
| -------------------------------- | ---------------------------------------- |
| `apps/backend`                   | Medusa v2 Backend                        |
| `apps/storefront-tropfshop`      | Next.js 15 Storefront (Pre-Launch-Page)  |
| `apps/docs`                      | ADR-Stubs + Runbooks                     |
| `packages/tsconfig`              | geteilte TypeScript-Config               |
| `packages/eslint-config`         | geteilte ESLint-Flat-Config              |
| `packages/tailwind-config`       | Brand-Presets (Tailwind)                 |
| `packages/shop-config`           | Brand-/Legal-Config pro Shop             |

## Skripte

```bash
pnpm dev         # alle Apps parallel
pnpm lint        # ESLint
pnpm typecheck   # tsc --noEmit
pnpm build       # Production-Build aller Apps
pnpm test        # Tests (Turbo)
```

E2E: `pnpm --filter @ufiso/storefront-tropfshop test:e2e` (Playwright).

## Doku

Architektur, Recht und Strategie liegen im **UFISO-Vault** (Obsidian).
Kurz-ADRs: [`apps/docs/adr/`](./apps/docs/adr/). Projekt-Kontext für
AI-Tools: [`CLAUDE.md`](./CLAUDE.md).

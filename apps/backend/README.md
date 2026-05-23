# @ufiso/backend — Medusa v2

Headless-Commerce-Backend für UFISO. Ein Sales Channel pro Shop
(siehe Vault `02-Architektur/Medusa-Sales-Channels.md` und ADR-002).
Erster Shop: **Tropfshop**.

- Storefront: `apps/storefront-tropfshop` (Port 3000)
- Backend-Port: 9000 (Admin + Store-API)
- Lokale Postgres + Redis aus `docker-compose.yml` (Postgres :15432, Redis :16379)
- Prod: Neon EU (Postgres) + Hetzner (Coolify), siehe Vault

## Lokale Boot-Sequenz (Schritt für Schritt)

Setzt voraus: Node ≥ 22, pnpm 11.

```powershell
# 1) Aus dem Repo-Root — lokale Infrastruktur
docker compose up -d              # Postgres + Redis
pnpm install --frozen-lockfile

# 2) Backend-ENV
cp apps/backend/.env.template apps/backend/.env
#   (falls .env schon existiert: vorhandene Werte beibehalten)

# 3) Schema migrieren (idempotent)
pnpm --filter @ufiso/backend db:migrate

# 4) Admin-User anlegen
#    Passwort generieren (z. B. via `openssl rand -base64 24`).
#    KEIN Commit — Eintrag in 1Password: "UFISO/Medusa Admin lokal".
pnpm --filter @ufiso/backend exec medusa user \
  --email admin@ufiso.local \
  --password <generiertes-passwort>

# 5) Foundation-Seed (Sales Channel `tropfshop`, Regionen DE/AT,
#    Stock Location, Versand, Publishable API Key)
#    Seed ist idempotent, beliebig wiederholbar (Lookup-Keys: name/country_code/
#    title, siehe Kommentar in src/scripts/seed.ts).
pnpm --filter @ufiso/backend seed
#    → Output enthaelt NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_...
#    → diesen Key in apps/storefront-tropfshop/.env.local eintragen.

# 6) Mock-Produkte fuer die Coming-Soon-Tiles (idempotent ueber SKU)
pnpm --filter @ufiso/backend seed:products

# 7) Dev-Server starten (Backend + Storefront)
pnpm dev
#    Backend:    http://localhost:9000
#    Admin:      http://localhost:9000/app
#    Storefront: http://localhost:3000
```

> **Foundation-Seed ist idempotent, beliebig wiederholbar.** Sales Channel,
> Regionen, Tax-Regionen, Stock Location, Fulfillment-Set, Shipping Option,
> Publishable API Key und alle Links werden per Lookup geprueft und nur
> angelegt, wenn sie noch nicht existieren (Sprint 3). Vorhandene Eintraege
> loggen `[seed] skip: <objekt> (id=...)`. Lookup-Keys siehe Kommentar in
> `src/scripts/seed.ts`. Test: `apps/backend/integration-tests/http/seed-idempotenz.spec.ts`.

## Wichtige Skripte

| Skript                                              | Zweck                                        |
| --------------------------------------------------- | -------------------------------------------- |
| `pnpm --filter @ufiso/backend dev`                  | `medusa develop` (Watch-Mode)                |
| `pnpm --filter @ufiso/backend db:migrate`           | DB-Schema migrieren                          |
| `pnpm --filter @ufiso/backend seed`                 | Foundation-Seed (Channels/Regionen/etc.)     |
| `pnpm --filter @ufiso/backend seed:products`        | Mock-Produkte (Bewässerungs-Sortiment)       |
| `pnpm --filter @ufiso/backend typecheck`            | TypeScript-Check                             |
| `pnpm --filter @ufiso/backend test:unit`            | Unit-Tests                                   |

## Storefront-Verbindung

Storefront liest aus `apps/storefront-tropfshop/.env.local`:

```env
NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_…   # aus Foundation-Seed-Output
```

Der Publishable API Key ist auf den Sales Channel `tropfshop` gescoped — nur
Produkte aus diesem Channel sind im Storefront sichtbar.

## Brevo-DOI (Newsletter, Storefront-seitig)

Storefront `.env.local`:

```env
BREVO_API_KEY=…
BREVO_NEWSLETTER_LIST_ID=…
BREVO_DOI_TEMPLATE_ID=…
# Dev: http://localhost:3000/newsletter-bestaetigt
# Prod: https://tropfshop.de/newsletter-bestaetigt
BREVO_DOI_REDIRECT_URL=http://localhost:3000/newsletter-bestaetigt
```

> Vor Prod-Deploy `BREVO_DOI_REDIRECT_URL` auf die `https://`-Variante setzen,
> sonst leitet Brevo nach Bestätigung in einen lokalen Dev-Server-Endpunkt.

## Troubleshooting

- **`ECONNREFUSED` auf 15432/16379** → `docker compose up -d` im Repo-Root.
- **Migrations laufen nicht durch** → Volume neu aufsetzen:
  `docker compose down -v && docker compose up -d`
  (löscht lokale DB! Re-Seed nötig).
- **`Foundation-Seed` mehrfach gelaufen** → unkritisch, Seed ist idempotent
  (skipt vorhandene Objekte, siehe oben). Falls dennoch Duplikate aus einem
  alten Lauf vor Sprint 3 existieren: Bereinigung über Admin-UI oder `psql`.
- Eskalation: Runbook `06-Runbooks/Backend-Boot-Lokal.md` im Vault.

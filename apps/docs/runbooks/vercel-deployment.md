# Runbook — Vercel-Deployment (Storefront)

> Phase-1-Operative-Anleitung fuer das Vercel-Preview des Tropfshop-
> Storefronts. **KEIN Backend** auf Vercel — Medusa-Backend laeuft
> spaeter auf Hetzner/Coolify (siehe Vault `02-Architektur/Inventory-Modell-Odoo-Sync.md`).
> Architektur-Hintergrund: Vault `02-Architektur/Hosting-Strategie.md`.

## Scope

Sprint 8 deployed **nur** `apps/storefront-tropfshop` als Vercel-Preview
(Auto-generierte `*.vercel.app`-URL). Phase 1 deckt:

- Pre-Launch-Page mit Newsletter-DOI (Brevo)
- Coming-Soon-Tiles (degraded ohne Backend — `pingMedusaConnection` failt
  stillschweigend, Tiles zeigen "Bald verfuegbar")
- Datenschutz + Impressum
- Klaro-Consent-Manager

Nicht im Scope: Custom-Domain (`tropfshop.de`), Cart/Checkout/PDP, Auth,
Backend-Deploy.

## Projekt-Setup (einmalig)

1. Vercel-Account: `ufiso.solingen@gmail.com` (Hobby-Tier reicht fuer
   Pre-Launch).
2. "New Project" → GitHub-Repo `dieburgersouce/ufiso-shop` importieren.
3. **Root Directory**: `apps/storefront-tropfshop`.
4. **Framework Preset**: Next.js (auto-detect).
5. **Build & Output**:
   - Build Command:
     `cd ../.. && pnpm install --frozen-lockfile && pnpm --filter @ufiso/storefront-tropfshop build`
   - Output Directory: `.next` (Default).
   - Install Command: `pnpm install --frozen-lockfile` (Root-Level).
   - Node Version: `22.x`.
   - Turborepo-Filter sorgt dafuer, dass nur das Storefront + seine
     Workspace-Deps gebaut werden (`@ufiso/shop-config`).
6. **Region**: Frankfurt (`fra1`) — EU-Datenhoheit.

## Environment Variables (Preview + Production)

In den Vercel-Project-Settings → Environment Variables setzen. Bezug zum
lokalen `.env.local.template`:

| Variable                            | Wert (Preview)                                                  | Pflicht | Quelle |
| ----------------------------------- | --------------------------------------------------------------- | ------- | ------ |
| `NEXT_PUBLIC_MEDUSA_BACKEND_URL`    | `http://localhost:9000` (Stub) ODER spaetere Hetzner-URL        | ja      | Sprint 8 Stub-OK, weil `pingMedusaConnection` fail-silent ist |
| `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`| Foundation-Seed-Output, lokaler Backend-Run, `apps/backend/.seed-output.json` | ja | Sprint 5 |
| `BREVO_API_KEY`                     | Brevo-API-Key (1Password `UFISO/Brevo`)                         | ja      | Sprint 4 |
| `BREVO_NEWSLETTER_LIST_ID`          | `1` (Liste "Tropfshop Newsletter")                              | ja      | Brevo-UI |
| `BREVO_DOI_TEMPLATE_ID`             | `1` (DOI-Template-ID)                                           | ja      | Brevo-UI |
| `BREVO_DOI_REDIRECT_URL`            | `https://<vercel-preview-url>/newsletter-bestaetigt`            | ja      | Pro Deployment |
| `LOGTAIL_SOURCE_TOKEN`              | BetterStack-Source-Token (1Password `UFISO/BetterStack`)        | optional | Sprint 6 — leer = kein Transport |

**Wichtig:**

- `BREVO_DOI_REDIRECT_URL` MUSS pro Deployment auf die jeweilige
  Vercel-URL zeigen (Preview-URL aendert sich je Branch). Brevo redirect
  greift sonst auf einen lokalen Dev-Pfad. Bei Phase-2-Custom-Domain auf
  `https://tropfshop.de/newsletter-bestaetigt` umstellen.
- **NICHT** `NEXT_PUBLIC_ENABLE_TEST_BRIDGE` setzen — das Flag mountet
  `window.__reportClientError` und gehoert nur in den E2E-Build
  (siehe `apps/storefront-tropfshop/README.md` + ADR-014).
- ENV-Variablen, die mit `NEXT_PUBLIC_` beginnen, werden in den Client-
  Bundle inlined. Vor jedem Wert pruefen, ob er oeffentlich sein darf.
- Vercel "Encrypted" fuer alle Secrets (`BREVO_API_KEY`,
  `LOGTAIL_SOURCE_TOKEN`) — Default fuer secret-aehnliche ENVs.

## Turborepo-Filter-Build

Vercel + Monorepo: Vercel honoriert standardmaessig nicht das Turborepo-
Layout. Workaround ueber das Build-Command (siehe oben):

```bash
cd ../.. && pnpm install --frozen-lockfile && pnpm --filter @ufiso/storefront-tropfshop build
```

Schritte:

1. `cd ../..` — auf Repo-Root wechseln.
2. `pnpm install --frozen-lockfile` — Workspace-Resolutions ziehen.
3. `pnpm --filter @ufiso/storefront-tropfshop build` — Turborepo loest
   `^build`-Dependencies auf (`@ufiso/shop-config` ist source-only, kein
   Build-Step → wird einfach mitkopiert).

Alternative: `vercel.json` mit `buildCommand` (nicht aufgesetzt, weil der
GUI-Workflow reicht und keine Build-Step-Customizations noetig sind).

## Verifizieren nach Deploy

1. **Build-Log**: kein Error, Klaro-Bundle im Output (`/_next/static/chunks/`).
2. **Smoke**: Preview-URL aufrufen — Pre-Launch-Page erscheint, Klaro-
   Banner zeigt sich.
3. **Newsletter-Submit**: Brevo-Round-Trip manuell durchspielen (siehe
   `brevo-roundtrip.md`). E-Mail muss eintrudeln, Bestaetigungs-Link auf
   `/newsletter-bestaetigt` redirecten, Liste anwachsen.
4. **Lighthouse**: `lighthouserc.production.json` gegen Preview-URL
   laufen lassen — Schwellen perf 0.9 / a11y 0.95 / bp 0.95 / seo 0.95.
   Lokal:

   ```bash
   pnpm --filter @ufiso/storefront-tropfshop lighthouse:production
   ```

   Wenn die Vercel-Preview-URL nicht der Default
   `https://tropfshop-storefront.vercel.app/` ist (z. B. Branch-Preview-
   Hash), per CLI ueberschreiben:

   ```bash
   pnpm --filter @ufiso/storefront-tropfshop lighthouse:production \
     --collect.url=https://tropfshop-storefront-abc.vercel.app/
   ```

   Bei Phase-2 mit Custom-Domain die URLs in
   `lighthouserc.production.json` auf `https://tropfshop.de/` umstellen.
5. **/api/health**: Backend-Stub-Pingt unterhalb der Storefront-Route;
   solange `NEXT_PUBLIC_MEDUSA_BACKEND_URL` auf `localhost:9000` zeigt,
   ist der Health-Probe `503` — das ist erwartet (Backend nicht oeffentlich).

## Phase-2 — Custom-Domain (Tropfshop)

Nicht in Sprint 8, aber dokumentiert fuer Folge-Sprint:

1. `tropfshop.de` bei einem Registrar (Hetzner/INWX) registrieren.
2. Vercel-Projekt → Settings → Domains → `tropfshop.de` hinzufuegen.
3. DNS:
   - `A` → `76.76.21.21` (Vercel-Anycast)
   - `AAAA` → `2606:4700:7::1`
   - `CNAME www` → `cname.vercel-dns.com.`
4. Vercel automatisch SSL via Let's Encrypt (kein Cloudflare im Vorlauf).
5. **Robots-Meta**: `app/layout.tsx` setzt aktuell `robots: { index: false }`.
   Vor Public-Launch entfernen ODER auf eigene Robots-Regel-Pfad-Whitelist.
6. **OpenGraph + Twitter**: `app/opengraph-image.tsx` haengt am Repo-Pfad —
   im Vercel-Build wegen Non-ASCII-Repo-Pfad-Workaround `force-dynamic`.
   Bei Custom-Domain pruefen, dass Crawler die OG-Karte ziehen.
7. `BREVO_DOI_REDIRECT_URL` auf `https://tropfshop.de/newsletter-bestaetigt`
   umstellen.

## Rollback

1. Vercel-Dashboard → Deployments → vorigen Build "Promote to Production".
2. Vorigen Branch via `git checkout <commit>` lokal pruefen.
3. Bei kompromittiertem ENV (z. B. Brevo-Key geleakt): Vercel-ENV
   loeschen → Re-Deploy → Brevo-Account neuen Key generieren.

## Verwandte Dokumente

- ADR: Vault `07-ADRs/ADR-005-Storefront-Deployment.md` (falls vorhanden)
- Architektur: Vault `02-Architektur/Hosting-Strategie.md`
- Lighthouse (Production-Profil): `apps/storefront-tropfshop/.lighthouserc.production.json`
- Brevo-Round-Trip: `apps/docs/runbooks/brevo-roundtrip.md`
- Observability: `apps/docs/runbooks/observability.md`

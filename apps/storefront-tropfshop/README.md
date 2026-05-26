# @ufiso/storefront-tropfshop

Next.js 15 Storefront fuer den Tropfshop (Pre-Launch — Newsletter-Capture,
Coming-Soon-Tiles, DOI-Confirm-Page). Verbunden mit Medusa via
`@medusajs/js-sdk` (lib/medusa.ts), graceful Degrade ohne Backend
(Vault: `02-Architektur/Test-Strategie.md`).

## Skripte

| Skript                                         | Zweck                                                |
| ---------------------------------------------- | ---------------------------------------------------- |
| `pnpm --filter @ufiso/storefront-tropfshop dev`        | Next-Dev-Server (`localhost:3000`)                   |
| `pnpm --filter @ufiso/storefront-tropfshop build`      | Production-Build                                     |
| `pnpm --filter @ufiso/storefront-tropfshop start`      | Production-Server (nach Build)                       |
| `pnpm --filter @ufiso/storefront-tropfshop test:e2e`   | Playwright-E2E (Coming-Soon, a11y, SEO, Newsletter, Consent) |
| `pnpm --filter @ufiso/storefront-tropfshop lighthouse` | Lighthouse-CI lokal (build voraus)                   |
| `pnpm --filter @ufiso/storefront-tropfshop typecheck`  | TypeScript-Check                                     |
| `pnpm --filter @ufiso/storefront-tropfshop lint`       | ESLint                                               |

## ENV (`.env.local`)

```env
NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_…   # aus Foundation-Seed-Output

BREVO_API_KEY=…
BREVO_NEWSLETTER_LIST_ID=…
BREVO_DOI_TEMPLATE_ID=…
# Dev:  http://localhost:3000/newsletter-bestaetigt
# Prod: https://tropfshop.de/newsletter-bestaetigt
BREVO_DOI_REDIRECT_URL=http://localhost:3000/newsletter-bestaetigt
```

> Vor Prod-Deploy `BREVO_DOI_REDIRECT_URL` zwingend auf die `https://`-Variante
> setzen, sonst leitet Brevo nach Bestaetigung in einen lokalen Dev-Server-Endpunkt.

## Brevo-DOI (Newsletter)

Manuelle Verifikations-Strecke siehe Runbook
[`apps/docs/runbooks/brevo-roundtrip.md`](../docs/runbooks/brevo-roundtrip.md):
Submit → DOI-Mail → Confirm-Link → Redirect → Brevo-Liste.

## E2E-Build mit TestErrorBridge

`components/test-error-bridge.tsx` exponiert `window.__reportClientError` und
wird **nur** gemountet, wenn `NEXT_PUBLIC_ENABLE_TEST_BRIDGE === "1"` zum
Zeitpunkt des Builds gesetzt ist (Sprint 8, ADR-014 Hardening). Production-
Builds rendern die Bruecke nicht — die Konsequenz: vor `pnpm test:e2e` muss
der Build mit dem Flag gemacht werden, sonst schlaegt `consent.spec.ts` mit
"TestErrorBridge fehlt — `__reportClientError` nicht da" fehl.

PowerShell:

```powershell
$env:NEXT_PUBLIC_ENABLE_TEST_BRIDGE="1"
pnpm --filter @ufiso/storefront-tropfshop build
pnpm --filter @ufiso/storefront-tropfshop test:e2e
```

bash / zsh:

```bash
NEXT_PUBLIC_ENABLE_TEST_BRIDGE=1 pnpm --filter @ufiso/storefront-tropfshop build
pnpm --filter @ufiso/storefront-tropfshop test:e2e
```

CI setzt das Flag im `Storefront-Build`-Step
(`.github/workflows/ci.yml`). `playwright.config.ts` setzt das Flag
zusaetzlich in `webServer.env` — wirkt aber nur fuer `next dev`-Pfade, weil
das App-Router-Layout bei `next start` statisch geprerendert ist.

## Quality Gates (Sprint 4)

- **Lighthouse CI** (`pnpm lighthouse`) — harte Schwellen `performance ≥ 0.9`,
  `seo ≥ 0.95`, `accessibility ≥ 0.95`, `best-practices ≥ 0.95`. CI-Workflow:
  `.github/workflows/lighthouse.yml`.
- **a11y** (`pnpm test:e2e -- e2e/a11y.spec.ts`) — axe-core WCAG 2.1 A + AA,
  0 critical/0 serious.
- **SEO-Smoke** (`pnpm test:e2e -- e2e/seo.spec.ts`) — robots.txt, sitemap.xml,
  OG/Twitter-Meta, Organization-JSON-LD.

Vault: `02-Architektur/Test-Strategie.md`, `05-Content-und-SEO/SEO-Strategie.md`.

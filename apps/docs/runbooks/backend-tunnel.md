# Runbook — Backend-Tunnel (Cloudflare Tunnel → localhost:9000)

> Phase-1-Bruecke vom lokal laufenden Medusa-Backend (`:9000`) zur
> Vercel-Storefront. Cloudflared spannt eine ausgehende Verbindung von
> der Solinger Workstation zu Cloudflares Edge, Cloudflare gibt eine
> Static-URL aus (`<sub>.trycloudflare.com` Quick-Tunnel oder
> `<name>.cfargotunnel.com` Named-Tunnel), Vercel-Storefront kennt die
> URL als `NEXT_PUBLIC_MEDUSA_BACKEND_URL`. **KEIN Backend-Deploy auf
> Vercel** — Architektur-Hintergrund: Vault
> `02-Architektur/Hosting-Strategie.md` und
> `02-Architektur/Backend-Tunnel-Bruecke.md`.

## Scope

Sprint 9 spannt den Tunnel nur, damit die Vercel-Preview echte
Coming-Soon-Tiles aus dem lokalen Foundation-Seed (15 Mock-Produkte,
Channel `tropfshop`) zeigen kann — statt der `pingMedusaConnection`-
Fallback-Tiles "Bald verfuegbar". Phase-1 transportiert ueber den Tunnel
**ausschliesslich**:

- `GET /store/products` (publishable-key-gegated, Produkt-Tiles)
- `GET /store/regions` (Region DE/AT fuer Versandkosten-Hinweis)
- `GET /store/sales-channels` (Channel-Resolver)
- `GET /health` (Health-Probe der Storefront)

Nicht im Scope: Cart/Checkout/PDP/Auth/Admin (alles, was Customer-Daten
oder Session-Cookies oder Admin-Aktionen anfasst). Sobald solche Routen
auf Vercel laufen wuerden, muss der Tunnel weg und durch Hetzner-Coolify
ersetzt werden — siehe DSGVO-Hinweis unten.

## DSGVO-Hinweis (Cloudflare-Mutter US)

- **Cloudflare Inc.** ist ein US-Unternehmen. CLOUD-Act-Risiko ist
  theoretisch da, aber konkret hier irrelevant, **solange ueber den
  Tunnel keine personenbezogenen Daten fliessen.**
- Phase-1-Traffic ist die oeffentliche Medusa-Store-API: Produkt-Tiles,
  Region-/Channel-Resolver. Diese Daten sind weder Kunden- noch Account-
  Daten — sie tauchen identisch im Source-Code, im Foundation-Seed und
  spaeter im SEO-Crawl auf.
- Cloudflare-Logs (TLS-Terminierung, Request-Headers): Anonymer Public-
  Traffic, kein PII. Kein DPA mit Cloudflare noetig fuer Phase 1.
- Vault `02-Architektur/Privacy-Stack.md` und `Backend-Tunnel-Bruecke.md`
  fuehren die Argumentation im Detail (Phase-2-Trigger, Re-Eval).
- **Antipattern**: Sobald Auth, Cart oder Checkout in die Storefront
  kommen, ist Cloudflare-Tunnel **NICHT** mehr OK — dann mit Hetzner
  ersetzen, **bevor** die Routen public werden.

## Voraussetzungen

- Lokales Backend laeuft (`docker compose up -d` + `pnpm dev`-Backend
  bzw. `pnpm --filter @ufiso/backend start`). Verifikation:
  `curl http://localhost:9000/health` → `200 ok`.
- Foundation-Seed ist gelaufen (`apps/backend/.seed-output.json` existiert,
  Publishable-Key + Channel-ID). Sonst sieht die Storefront leere Tiles.
- 1Password-Eintrag `UFISO/Cloudflare-Tunnel` ist angelegt (initial leer
  — Token wird im Setup-Schritt befuellt).
- Cloudflare-Account vorhanden (free), Zero-Trust-Dashboard erreichbar.

## Variante A — Quick-Tunnel (5-Minuten-Setup, ephemer)

> Fuer den allerersten Smoke-Test. Quick-Tunnel-URLs sind ephemer —
> bei jedem Re-Start neue URL → Vercel-ENV-Schleife. Nur fuer schnelles
> Ausprobieren; produktiv ist Variante B.

```pwsh
winget install --id Cloudflare.cloudflared
cloudflared tunnel --url http://localhost:9000
```

Cloudflared gibt eine `https://<random>.trycloudflare.com`-URL aus.
Diese in Vercel `NEXT_PUBLIC_MEDUSA_BACKEND_URL` einsetzen, Re-Deploy
(siehe `vercel-deployment.md`). Smoke: `curl <url>/health` → `200`,
Vercel-Storefront Tiles zeigen die 15 Mock-Produkte.

## Variante B — Named-Tunnel (Sprint 9 produktiv, Static-URL)

> Static-URL, ueberlebt Re-Start. Token in 1Password sichern.

### Setup (einmalig)

1. `winget install --id Cloudflare.cloudflared` (oder Homebrew/apt fuer
   andere Maschinen).
2. `cloudflared tunnel login` — oeffnet Browser, Cloudflare-Login,
   waehlt das Konto. Schreibt `~/.cloudflared/cert.pem`.
3. `cloudflared tunnel create ufiso-backend-local`
   → erzeugt einen Tunnel mit fester UUID + Credentials-JSON unter
   `~/.cloudflared/<uuid>.json`. Beide Strings in 1Password
   `UFISO/Cloudflare-Tunnel` sichern (Tunnel-UUID + Credentials-JSON-
   Inhalt im Notes-Feld).
4. `~/.cloudflared/config.yml` anlegen:

   ```yaml
   tunnel: <uuid>
   credentials-file: C:\Users\benfi\.cloudflared\<uuid>.json
   ingress:
     - hostname: ufiso-backend-local.<your-cf-zone>
       service: http://localhost:9000
     - service: http_status:404
   ```

   Wenn keine eigene Cloudflare-Zone vorhanden ist (Phase-1-default):
   stattdessen Cloudflare-Tunnel-Hostname via Zero-Trust-Dashboard
   anlegen (Cloudflare gibt `<name>.cfargotunnel.com`). Im Dashboard
   unter Networks → Tunnels → ufiso-backend-local → Public Hostname.
5. `cloudflared tunnel route dns ufiso-backend-local <hostname>`
   (entfaellt bei `cfargotunnel.com`-Default).

### Start (jede Session)

```pwsh
cloudflared tunnel run ufiso-backend-local
```

Laeuft im Vordergrund, blockiert das Terminal — als eigenen Tab oder
PowerShell-Job parallel zu `pnpm dev` halten. Cloudflared schreibt
Heartbeat-Logs, `ERROR`-Zeilen kommen erst, wenn die ausgehende
Verbindung bricht.

Optional als Windows-Service:

```pwsh
cloudflared service install
```

Liest `~/.cloudflared/config.yml` und startet als Hintergrund-Service.
Phase-1-default ist **manueller Start** — der Tunnel braucht nicht zu
laufen, wenn die Storefront nicht aktiv getestet wird.

### Smoke

1. `curl https://<tunnel-url>/health` → `200 ok`.
2. `curl https://<tunnel-url>/store/regions` mit Publishable-Key-Header
   (`x-publishable-api-key: <key aus .seed-output.json>`) → 200 + JSON
   mit Region DE/AT.
3. Vercel-Storefront besuchen → Coming-Soon-Tiles zeigen 15 echte
   Mock-Produkte (statt Fallback).

## ENV (Vercel-Project ufiso-commerce-storefront-tropfshop)

Vercel-Dashboard → Settings → Environment Variables → setzen
(Preview-Environment reicht; bei Production identisch):

| Variable | Wert | Quelle |
| --- | --- | --- |
| `NEXT_PUBLIC_MEDUSA_BACKEND_URL` | `https://<tunnel-url>` (ohne trailing slash) | Tunnel-Hostname aus Variante A/B |
| `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` | aus `apps/backend/.seed-output.json` | Foundation-Seed |

Nach jedem Tunnel-URL-Wechsel (Quick-Tunnel) MUSS ein Re-Deploy
ausgeloest werden — Next.js inlinet `NEXT_PUBLIC_*` zur Build-Zeit.
Empfehlung: **gleich auf Variante B** umsteigen, damit die URL stabil
ist und die ENV-Schleife entfaellt.

## Troubleshooting

| Symptom | Erste Vermutung | Aktion |
| --- | --- | --- |
| Storefront-Tiles zeigen weiterhin "Bald verfuegbar" | `NEXT_PUBLIC_MEDUSA_BACKEND_URL` falsch oder Re-Deploy fehlt | Vercel-ENV pruefen, Re-Deploy triggern |
| `curl <tunnel>/health` → `502` | Backend nicht erreichbar von cloudflared aus | `curl localhost:9000/health` lokal, Backend re-starten |
| `curl <tunnel>/store/products` → `401` | Publishable-Key fehlt oder ist alt | Header `x-publishable-api-key` mitschicken, gegen `.seed-output.json` vergleichen |
| Tunnel-URL aendert sich jeden Restart | Variante A (Quick-Tunnel) | Auf Variante B (Named-Tunnel) umsteigen |
| `cloudflared` startet nicht | Credentials-JSON oder `cert.pem` weg | `cloudflared tunnel login` wiederholen, JSON aus 1Password wiederherstellen |
| Vercel-Storefront 500 bei `/api/health` | Storefront-Proxy schickt an Backend, Backend down | Backend re-starten ODER `NEXT_PUBLIC_MEDUSA_BACKEND_URL` auf Stub setzen |

## Phase-2-Ersatz — Hetzner-Coolify

Sobald der Hetzner-Coolify-Stack steht (Vault `Inventory-Modell-Odoo-Sync.md`,
Phase 2):

1. Medusa-Backend als Coolify-Application deployen, Postgres + Redis als
   Managed-Services hinter privatem Netz.
2. Public-FQDN via Coolify-Proxy (Caddy/Traefik) + Let's-Encrypt-TLS,
   z. B. `api.tropfshop.de` (oder Subdomain unter `ufiso.de`).
3. `NEXT_PUBLIC_MEDUSA_BACKEND_URL` in Vercel auf die Hetzner-URL
   umstellen, Re-Deploy.
4. Cloudflare-Tunnel **stoppen + Named-Tunnel loeschen** (`cloudflared
   tunnel delete ufiso-backend-local`). Credentials aus 1Password
   archivieren, nicht loeschen — falls Rollback noetig.
5. DSGVO-AVV mit Hetzner pruefen (ist Standard, deutsch + EU).
6. Mit Hetzner duerfen dann auch User-Daten / Cart / Checkout durch —
   der Cloudflare-Phase-1-Antipattern entfaellt.

Phase-2-Trigger:

- Hetzner-Coolify ist gebootet (haengt am Vater-Termin, siehe
  [[Wo-stehe-ich-gerade]]).
- Erste Public-Traffic-Quelle (Marketing, Custom-Domain).
- Cart/Checkout-Sprint geplant.

## Verwandte Dokumente

- Vault: `02-Architektur/Backend-Tunnel-Bruecke.md` (Begruendung +
  Trade-off + Phase-2-Abloesung).
- Vault: `02-Architektur/Hosting-Strategie.md` (Gesamtbild).
- Runbook: `vercel-deployment.md` (Storefront-ENVs + Re-Deploy).
- Runbook: `observability.md` (Logs lesen, /health-Probe).

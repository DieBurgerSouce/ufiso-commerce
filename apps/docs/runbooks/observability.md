# Runbook — Observability (Logs, Health, Error-Tracking)

> Sprint 6. Stack-Entscheidungen: Vault ADR-012 (Logging) + ADR-013 (Error-Tracking)
> + `02-Architektur/Logging-Observability.md`.

## TL;DR

- **Logger**: Pino strukturiert (`apps/backend/src/lib/logger.ts`,
  `apps/storefront-tropfshop/lib/logger.ts`). Lokal `pino-pretty`, sonst JSON.
- **Sink**: BetterStack (EU). ENV `LOGTAIL_SOURCE_TOKEN`. Leer = no-op.
- **Health**: Backend `/health` prueft Postgres + Redis, Storefront `/api/health`
  proxified Backend `/health`.
- **Client-Errors**: `app/global-error.tsx` POSTet nach `/api/log-client-error`.

## Lokale Logs lesen

### Backend (Medusa)

`pnpm --filter @ufiso/backend dev` (oder `start`):

- `NODE_ENV=development` → `pino-pretty` farbig, eine Zeile pro Event.
- `NODE_ENV=production` (CI, prod) → JSON-Lines, eine Zeile pro Event.

JSON-Logs filtern in der Shell:

```bash
# Alle Skip-Events des Seeds:
pnpm --filter @ufiso/backend seed | grep '"event":"seed.skip"'

# Nur Errors:
pnpm --filter @ufiso/backend start | jq -c 'select(.level >= 50)'

# Nach Component filtern:
pnpm --filter @ufiso/backend start | jq -c 'select(.component == "health")'
```

`pino-pretty` auch nachtraeglich auf JSON anwenden:

```bash
pnpm --filter @ufiso/backend start 2>&1 | npx pino-pretty -c -t SYS:HH:MM:ss
```

### Storefront (Next.js)

Storefront-Pino laeuft **server-only**. Browser-Errors gehen ueber
`/api/log-client-error` → Storefront-Pino → BetterStack.

`pnpm --filter @ufiso/storefront-tropfshop dev` produziert pretty-Logs im
Terminal. Bei `next start` (Prod-Mode) sind sie JSON-Lines.

## BetterStack-Dashboard

> Stand 2026-05-23: Account ist noch nicht aktiviert. Sobald Ben den Account
> einrichtet, hier konkretisieren.

Aktivierungs-Checkliste (Ben, nach ADR-013-Akzeptanz):

1. BetterStack-Account anlegen, **EU-Region** waehlen.
2. Zwei Sources erstellen:
   - `ufiso-backend` → Token in Coolify-ENV `LOGTAIL_SOURCE_TOKEN`.
   - `ufiso-storefront` → Token in Vercel-ENV `LOGTAIL_SOURCE_TOKEN`.
3. Retention auf 14 Tage (DSGVO-konform, siehe Logging-Observability.md).
4. Alerts gemaess Tabelle in `02-Architektur/Logging-Observability.md`
   (uncaughtException → Telegram P0, /health rot > 2 min → Telegram + Email
   P0 etc.).

Dashboard-Use-Cases (sobald live):

- "Letzte 50 Errors" — Filter `level:50` (= `error`).
- "Foundation-Seed-Laeufe" — Filter `component:foundation-seed event:seed.complete`.
- "Health-Failures pro Stunde" — Filter `component:health event:health.fail`.
- "Welcher Endpoint crasht oft" — Group `client.error pathname` (Storefront).

## PII-Audit-Checkliste

Vor jedem PR mit neuen Log-Lines: gegen die Redact-Pfad-Liste in
`apps/backend/src/lib/logger.ts` und `apps/storefront-tropfshop/lib/logger.ts`
abgleichen. Konkret:

- [ ] Keine Email-Adresse im Klartext (Pino-Redact greift `*.email` ueberall —
  trotzdem prufen, dass das Feld auch wirklich `email` heisst).
- [ ] Keine `Authorization`-Header in den Log-Bindings.
- [ ] Keine Cookies / `set-cookie`.
- [ ] Keine `password`, `token`, `secret`, `api_key`.
- [ ] Keine Adressen (`shipping_address`, `billing_address`).
- [ ] Stack-Traces sind OK, aber Exception-Daten checken
  (`err.cause` kann Body-Felder enthalten — manuell auf `[REDACTED]`-Marker pruefen).

Wenn ein neues Sensitive-Field auftaucht, `REDACT_PATHS` ergaenzen — beide
Logger-Module synchron halten.

Test-Idee (Sprint-7-Kandidat): jest-Snapshot, der einen Log-Call mit allen
PII-Feldern macht und den `JSON.stringify(output)` gegen ein Snapshot vergleicht.

## /health pruefen

### Lokal (Backend laeuft auf :9000, Storefront auf :3000)

```bash
curl -s http://localhost:9000/health | jq
curl -s http://localhost:3000/api/health | jq
```

Erwartet bei beiden:

```json
{ "status": "ok", "durationMs": 12, "checks": { "db": { "ok": true }, "redis": { "ok": true } } }
```

### Redis-Stop-Test (Sprint-6-Akzeptanz)

```bash
# 1. Backend laeuft, /health = 200.
# 2. Redis-Container stoppen:
docker compose stop redis
# 3. /health sollte jetzt 503 liefern:
curl -i http://localhost:9000/health
#    → HTTP/1.1 503 Service Unavailable
#    → { "status":"fail", "checks":{"redis":{"ok":false,"error":"..."}}}
# 4. Storefront /api/health auch 503:
curl -i http://localhost:3000/api/health
# 5. Aufraeumen:
docker compose start redis
```

Wenn Schritt 3 **nicht** 503 liefert, ist die Custom-/health-Route nicht aktiv —
Medusa-Default-Route hat gewonnen. Pruefen: `apps/backend/src/api/health/route.ts`
existiert, Backend wurde neu gebaut (`pnpm --filter @ufiso/backend build`).

## CI

`.github/workflows/ci.yml` setzt in beiden Backend-Jobs:

- `LOG_LEVEL=info` (Sprint 6).
- `LOGTAIL_SOURCE_TOKEN` bewusst nicht gesetzt — kein Sink, kein Pollute.

`wait-on http://localhost:9000/health` (60 s) im `e2e-with-backend`-Job
hat seit Sprint 6 strengere Semantik: er antwortet nur 200, wenn DB+Redis
beide gruen sind. CI-Service-Container muessen also wirklich laufen, sonst
schlaegt der Step fehl — das ist gewollt.

## Storefront-Client-Errors

`app/global-error.tsx` ist ein Client-Boundary, der bei Render-Fehlern im
Root-Layout greift. Beim Mount POSTet er den Fehler an
`/api/log-client-error` (server-side Pino-Route), zusammen mit:

- `message`, `stack`, `digest` (von React)
- `pathname` (aus `window.location`)
- `userAgent` (aus Request-Header, vom Server gelesen)

Vor dem Senden prueft `lib/consent.ts.hasErrorTrackingConsent()` den
Klaro-Consent. **Stand Sprint 6**: Stub gibt permanent `true` zurueck —
der vollstaendige Klaro-Volleinbau ist ein eigener Sprint
(Sprint-7-Kandidat). Bis dahin ist das vertretbar, weil:

- Coming-Soon-Tiles + DOI-Newsletter sind die einzigen UI-Pfade in
  Phase 1.
- Browser-Errors sind technisch (`TypeError: ...`), enthalten keine
  user-eingegebenen PII.
- Pino-Redact schiesst PII auf Server-Seite zusaetzlich raus.

## Verlinkungen

- Vault: `02-Architektur/Logging-Observability.md`
- Vault: `07-ADRs/ADR-012-Logging-Stack.md`
- Vault: `07-ADRs/ADR-013-Error-Tracking.md`
- Repo: `apps/backend/src/lib/logger.ts`,
  `apps/storefront-tropfshop/lib/logger.ts`,
  `apps/backend/src/api/health/route.ts`,
  `apps/storefront-tropfshop/app/api/health/route.ts`,
  `apps/storefront-tropfshop/app/global-error.tsx`

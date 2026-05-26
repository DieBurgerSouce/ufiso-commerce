# Runbooks

Incident-Handbücher. Langfassung im Vault (`09-Runbooks/`):

- Incident — Medusa Down
- Incident — Payment Fails
- Incident — Postgres Down
- Rollback-Procedure

Sobald die Produktions-Infrastruktur steht (Phase 3), werden die einsatz-
relevanten Kurzfassungen hierher gespiegelt.

## Aktive Runbooks

- [`brevo-roundtrip.md`](./brevo-roundtrip.md) — manuelle Brevo-DOI-Test-Sequenz.
- [`observability.md`](./observability.md) — Logs lesen, BetterStack-Setup,
  PII-Audit, /health-Tests (Sprint 6).
- [`consent.md`](./consent.md) — Klaro-Consent: Brand hinzufuegen, Service
  hinzufuegen, Debugging-Pfad, Klaro-Version-Upgrade (Sprint 7).
- [`vercel-deployment.md`](./vercel-deployment.md) — Vercel-Preview Storefront-
  Deploy: ENV-Liste, Turborepo-Filter-Build, Custom-Domain-Phase-2 (Sprint 8).
- [`backend-tunnel.md`](./backend-tunnel.md) — Cloudflare-Tunnel-Bruecke
  Phase-1: lokales Medusa-Backend → Vercel-Storefront, DSGVO-Trade-off,
  Phase-2-Ersatz Hetzner-Coolify (Sprint 9).

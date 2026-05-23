# Runbook — Brevo Double-Opt-In Roundtrip

> Manuelle Verifikation der Newsletter-DOI-Strecke der Tropfshop-Storefront.
> Langfassung im Vault (`09-Runbooks/`), Themen-Note in
> `05-Content-und-SEO/Pre-Launch-Newsletter.md`.

## Wann ausfuehren

- Nach jedem Brevo-Account-Setup-Change (List-ID, Template-ID, API-Key-Rotation).
- Vor jedem Prod-Deploy, der den Newsletter-Flow beruehrt
  (`components/newsletter-form.tsx`, `app/api/newsletter/route.ts`,
  `app/newsletter-bestaetigt/page.tsx`, `lib/medusa.ts`).
- Bei Kunden-Report "DOI-Mail nicht angekommen" — als Erstcheck.

## Voraussetzungen

- Lokales Setup ist gebootet (`docker compose up -d`, Backend nicht
  zwingend noetig — der Newsletter-Flow geht direkt an die Brevo-API).
- `apps/storefront-tropfshop/.env.local` enthaelt:
  - `BREVO_API_KEY` — gueltiger API-Key (Brevo → SMTP & API → API Keys).
  - `BREVO_NEWSLETTER_LIST_ID` — numerische Listen-ID (Brevo → Contacts → Lists).
  - `BREVO_DOI_TEMPLATE_ID` — Template-ID der DOI-Bestaetigungs-Mail.
  - `BREVO_DOI_REDIRECT_URL` — **`http://localhost:3000/newsletter-bestaetigt`**
    fuer lokale Tests, **`https://tropfshop.de/newsletter-bestaetigt`** in Prod.
- Eine Brevo-fremde Mail-Adresse (z.B. private Gmail), die NICHT bereits
  auf der Liste ist. Vor jedem Lauf in Brevo aus der Liste entfernen,
  sonst antwortet Brevo mit "already in list" und der Test verifiziert
  nichts.

## Schritt-fuer-Schritt

1. **Submit testen**
   - `pnpm --filter @ufiso/storefront-tropfshop dev` starten.
   - Browser auf `http://localhost:3000` oeffnen.
   - Testmail im Newsletter-Formular eingeben, abschicken.
   - Erwartung: UI bestaetigt "Wir haben Ihnen eine Mail geschickt" (oder
     die Komponenten-spezifische Erfolgs-Message). Network-Tab:
     `POST /api/newsletter` → `200`.

2. **DOI-Mail pruefen**
   - Posteingang der Testmail oeffnen.
   - Erwartung: Mail vom Brevo-Sender mit dem in `BREVO_DOI_TEMPLATE_ID`
     hinterlegten Template (Brand-Logo, Bestaetigungs-Button).
   - **Bei Ausbleiben**: Brevo → Transactional → Logs filtern nach der
     Testmail-Adresse. Status `delivered` vs. `softBounce/hardBounce`
     dokumentiert den Fehlerpunkt.

3. **Confirm-Link klicken**
   - Klick auf den DOI-Bestaetigungs-Link in der Mail.
   - Erwartung: Browser landet auf `BREVO_DOI_REDIRECT_URL` (lokal:
     `localhost:3000/newsletter-bestaetigt`). Seite zeigt Hero
     "Anmeldung bestätigt — danke!" plus den 10 %-Frueh-Buecker-Hinweis.

4. **Listen-Eintrag verifizieren**
   - Brevo → Contacts → Lists → die Pre-Launch-Liste oeffnen.
   - Erwartung: Testmail erscheint, Status `confirmed` (nicht `pending`).

5. **Aufraeumen**
   - Testmail aus der Brevo-Liste loeschen, damit der naechste Lauf
     wieder bei Null beginnt.

## Akzeptanz

- Submit ohne Honeypot-Trigger: `200 OK`, DOI-Mail kommt an, Confirm-Link
  funktioniert, Redirect landet auf der Bestaetigungs-Page,
  Listen-Eintrag steht auf `confirmed`.
- Submit MIT gefuelltem Honeypot (`website`-Feld im DOM): `200 OK` ohne
  Brevo-Call (per `curl` reproduzieren, siehe `app/api/newsletter/route.ts`).

## Was tun, wenn der Test fehlschlaegt

| Symptom | Erste Vermutung | Aktion |
|---|---|---|
| `POST /api/newsletter` → 500 | API-Key falsch / abgelaufen | `BREVO_API_KEY` rotieren, Brevo-Logs checken |
| Mail kommt nicht | Sender-Domain nicht authentifiziert | Brevo → Senders & IPs → Domain-Status pruefen (SPF/DKIM) |
| Confirm-Link 404 | `BREVO_DOI_REDIRECT_URL` zeigt auf Prod, lokal ist nichts erreichbar | ENV neu setzen + Storefront neu starten |
| Listen-Eintrag bleibt `pending` | DOI-Workflow im Brevo-UI falsch konfiguriert | Brevo → Automation → DOI-Workflow neu binden |

## Verweise

- Storefront-README: `apps/storefront-tropfshop/README.md` →
  Abschnitt "Brevo-DOI (Newsletter)".
- Vault: `05-Content-und-SEO/Pre-Launch-Newsletter.md`,
  `02-Architektur/Email-Versand.md`.

# Runbook — Consent-Manager (Klaro)

> Operative Anleitung: Brand hinzufuegen, Service hinzufuegen, Consent
> debuggen. Architektur-Hintergrund in `~/Obsidian/Storage/_UFISO/02-Architektur/Privacy-Stack.md`
> und [[ADR-014-Consent-Stack]].

## Brand N+1 hinzufuegen

Beispiel: Sprint 8 bringt den Hofladen-Shop online.

1. Brand-Modul `packages/shop-config/src/hofladen/` anlegen (analog zu
   `tropfshop/`).
2. Datei `packages/shop-config/src/hofladen/klaro.ts` anlegen, vom
   gleichen `ShopKlaroConfig`-Typ:

   ```ts
   import type { ShopKlaroConfig } from "../klaro-config";

   export const hofladenKlaroConfig: ShopKlaroConfig = {
     cookieName: "klaro-hofladen",
     privacyPolicyUrl: "/datenschutz",
     imprintUrl: "/impressum",
     purposes: [/* deutsch, Sie-Anrede */],
     services: [/* min. die error-tracking-Service */],
   };
   ```

3. Export aus `packages/shop-config/src/hofladen/index.ts` durchstellen.
   Top-Level-`packages/shop-config/src/index.ts` re-exportiert
   ggf. die typischen Symbole.
4. In der Hofladen-Storefront-App den `KlaroProvider` einbauen, der
   `hofladenKlaroConfig` importiert (statt `tropfshopKlaroConfig`).
   Wenn der `KlaroProvider` ueber alle Shops gleich aussehen soll: den
   Provider in ein internes Package extrahieren, das eine `klaroConfig`-
   Prop bekommt.

Cookie-Name MUSS pro Shop eindeutig sein (`klaro-<shop-slug>`) — sonst
kollidieren Consent-Entscheidungen, wenn Shops sich Domains teilen.

## Service hinzufuegen

Beispiel: Stripe Checkout-Loader in Phase 2.

1. In `<brand>/klaro.ts` ein neues `ShopKlaroService`-Objekt ergaenzen:

   ```ts
   {
     name: "stripe-checkout",
     title: "Stripe (Zahlungsabwicklung)",
     description:
       "Wir laden das Stripe-Checkout-Skript, sobald Sie zur Kasse gehen. Stripe ist unser Zahlungsanbieter (Stripe Payments Europe Ltd., Dublin).",
     purposes: ["payment"],
     cookies: [/^__stripe_/, "stripe-mid"],
     default: true,
     required: true,
     onlyOnce: false, // siehe "onlyOnce-Stolperstein" weiter unten
   },
   ```

2. Wenn der Service essential ist (Cart/Checkout), `required: true`
   setzen — Klaro zeigt dann "(immer erforderlich)" und der Schalter ist
   deaktiviert. Trotzdem **muss** der Service im Manager auftauchen, weil
   Nutzer das Recht haben zu sehen, was da geladen wird.
3. Passende Purpose ggf. ergaenzen, falls noch nicht in `purposes[]`
   vorhanden.
4. Frontend-Integration: vor jeder Stripe-Loader-Initialisierung
   `klaro.getManager().getConsent("stripe-checkout")` pruefen — oder
   einen Helper analog `hasErrorTrackingConsent()` in
   `apps/storefront-tropfshop/lib/consent.ts` anlegen.
5. E2E-Test in `apps/storefront-tropfshop/e2e/consent.spec.ts`
   erweitern: Banner-Buttons + Cookie-Assertion.

### onlyOnce-Stolperstein (Sprint 8)

`buildKlaroConfig()` in
`packages/shop-config/src/klaro-config-builder.ts` setzt fuer jeden
Service standardmaessig `onlyOnce: true` (Klaro-Doku-Empfehlung fuer
Auto-Snippet-Services). Klaro fuehrt den Service-Callback dann **nur
einmal pro Consent-Toggle** aus.

Fuer die Phase-1-Services `betterstack-telemetry` + `brevo-doi` ist das
egal, weil sie keinen Auto-Loader haben — der Frontend-Reporter liest
nur den Cookie und sendet selbst.

**Aber** Phase-2-Services mit Auto-Snippet (typisch: Stripe Checkout-
Loader, Plausible-Analytics) brauchen `onlyOnce: false`:

- Stripe laedt sein Skript je nach Route nach (Checkout vs. Customer-
  Portal). Mit `onlyOnce: true` bleibt der zweite Load aus, und der
  Checkout-Pfad bricht still.
- Plausible reinitialisiert sich bei SPA-Navigation. Mit `onlyOnce: true`
  feuert das `page-view`-Event nur beim ersten Mount.

Vor Sprint > 8 (sobald Stripe oder Plausible reinkommt) im jeweiligen
Brand-Modul `onlyOnce: false` explizit setzen — die Brand-Datei ueber-
schreibt den Builder-Default ueber `service.onlyOnce ?? true` in
`klaro-config-builder.ts`. Im Builder-Default selbst NICHT aendern,
damit existierende No-Snippet-Services nicht versehentlich doppelt
feuern.

## Consent debuggen

### Banner taucht nicht auf

1. Browser-DevTools → Application → Cookies → `klaro-tropfshop` schon
   gesetzt? Wenn ja, Klaro denkt der User hat bereits entschieden.
   Cookie loeschen → reload.
2. Console → Fehler beim Klaro-Setup? `[klaro] setup failed ...` weist
   auf ein Bundling-Problem hin (Next.js + CJS-Interop). Pruefe, ob
   `klaro/dist/klaro.js` im Bundle liegt (in `.next/static/chunks/`).
3. Adblocker aktiv? Manche listen Klaro nicht — aber Defensiv-Check:
   `lib/consent.ts.hasErrorTrackingConsent()` gibt `false` zurueck,
   wenn Cookie nicht da → Default-Deny bleibt erhalten.

### Telemetrie sendet trotz Ablehnen

1. Cookie inspizieren: `klaro-tropfshop` muss
   `{"betterstack-telemetry":false,...}` enthalten.
2. `lib/consent.ts.hasErrorTrackingConsent()` im Browser-Devtools-
   Console aufrufen — sollte `false` zurueckgeben.
3. `Network`-Tab → POST auf `/api/log-client-error`? Wenn ja, prueft der
   Reporter den Consent NICHT korrekt. Suche nach Aufrufen, die `fetch`
   direkt aufrufen (statt `reportClientError`) — das ist die wahrschein-
   lichste Quelle.

### Banner ueberlagert Page-Elemente

1. Klaro rendert die Notice als Modal (Konfig `noticeAsModal=true`).
   Das ist beabsichtigt — DSGVO-konform "vor Nutzung der Seite
   entscheiden".
2. Wenn Tests betroffen sind (Klick auf Element im Hintergrund):
   `e2e/newsletter-bestaetigt.spec.ts` zeigt das Pattern — Klaro-Cookie
   im `beforeEach` via `context.addCookies([...])` setzen.

### a11y-Verstoss "color-contrast" im Banner

1. Klaro injiziert sein CSS nach unseren `globals.css` → CSS-Override
   braucht `!important` oder hoehere Specificity, sonst gewinnen die
   Defaults.
2. Aktuelle Overrides in `apps/storefront-tropfshop/app/globals.css`:
   - `.klaro .cookie-modal a` → `color: #ffffff !important`
   - `.cm-btn.cm-btn-success` → dunkelgruener Hintergrund + weisser Text
   - `.cm-btn.cm-btn-info / .cm-btn-lern-more` → dunkelblau
3. Bei neuen Klaro-Major-Versionen erneut testen — axe-core via
   `pnpm test:e2e` deckt das automatisch ab.

### Klaro-Version-Upgrade

1. `klaro@<neu>` in `apps/storefront-tropfshop/package.json` pinnen.
2. `types/klaro.d.ts` durchgehen — neue/geaenderte API?
3. `lib/consent.ts` Cookie-Format pruefen (Klaro 0.7 flach
   `{service: bool}`, ein Wrapper-Fallback ist eingebaut).
4. CSS-Variablen-Namen pruefen (`--green1`, `--blue1`, ...).
5. Full E2E-Lauf: `PORT=<frei> npx playwright test`.

## Verwandte Dokumente

- ADR: `~/Obsidian/Storage/_UFISO/07-ADRs/ADR-014-Consent-Stack.md`
- Architektur: `~/Obsidian/Storage/_UFISO/02-Architektur/Privacy-Stack.md`
- Logging-Pendant: `apps/docs/runbooks/observability.md`
- ADR-013 (Error-Tracking, fuer das der Klaro-Hook gilt):
  `~/Obsidian/Storage/_UFISO/07-ADRs/ADR-013-Error-Tracking.md`

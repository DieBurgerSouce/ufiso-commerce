import { NextResponse, type NextRequest } from "next/server";
import { LRUCache } from "lru-cache";
import { createComponentLogger } from "@/lib/logger";

/**
 * POST /api/log-client-error
 *
 * Nimmt Browser-Error-Reports von app/global-error.tsx + freier Reports von
 * Error-Boundaries entgegen und leitet sie an den Server-Pino-Logger weiter.
 * Server-Pino schreibt strukturierte JSON-Lines nach stdout + (optional)
 * BetterStack — Browser-Errors landen damit am selben Ziel wie Backend-Errors.
 *
 * **Kein Consent-Check hier**: Das Gate liegt im Browser
 * (`app/global-error.tsx` prueft `hasErrorTrackingConsent()`). Ein
 * Server-Re-Check waere wirkungslos, weil `fetch(..., { keepalive: true })`
 * den Cookie-Header nicht zuverlaessig mitsendet. Wenn ein Request hier
 * ankommt, hat der Client bereits zugestimmt.
 *
 * Schutz-Layer, die trotzdem greifen:
 *  - IP-Sliding-Window-Rate-Limit (ADR-014 Phase 2), Best-effort per Lambda-
 *    Instance (nicht global, kein Redis in Phase 1).
 *  - Body wird strikt geparst, fremde Felder fallen raus.
 *  - Pino-`redact` aus lib/logger.ts redigiert PII zentral.
 *
 * Response: 204 No Content (auch bei Rate-Limit-Hit + Validation-Fail —
 * kein Nutzwert fuer Angreifer, einen Fehler-Reporter-Endpoint zu probieren).
 */

const log = createComponentLogger("client-error");

const MAX_FIELD_LENGTH = 8_000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 5;
const BETTERSTACK_FETCH_TIMEOUT_MS = 2_000;

// Best-effort IP-Sliding-Window. LRU cappt den Speicher; in serverless
// laeuft die Map pro Lambda-Instance — ein Angreifer mit viel Traffic
// trifft mehrere Instanzen und kommt entsprechend hoeher als 5/min global
// durch. Akzeptabler Phase-1-Trade-off (Hetzner+Redis in Phase 2).
const rateLimitCache = new LRUCache<string, number[]>({
  max: 10_000,
  ttl: RATE_LIMIT_WINDOW_MS,
});

function clamp(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  if (value.length === 0) return undefined;
  return value.length > MAX_FIELD_LENGTH ? value.slice(0, MAX_FIELD_LENGTH) : value;
}

function getClientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

function checkRate(ip: string): { limited: boolean; remaining: number } {
  const now = Date.now();
  const recent = (rateLimitCache.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= RATE_LIMIT_MAX) {
    rateLimitCache.set(ip, recent);
    return { limited: true, remaining: 0 };
  }
  recent.push(now);
  rateLimitCache.set(ip, recent);
  return { limited: false, remaining: Math.max(0, RATE_LIMIT_MAX - recent.length) };
}

function rateLimitHeaders(remaining: number): HeadersInit {
  return {
    "X-RateLimit-Limit": String(RATE_LIMIT_MAX),
    "X-RateLimit-Remaining": String(remaining),
    "X-RateLimit-Window-Seconds": String(RATE_LIMIT_WINDOW_MS / 1000),
  };
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rate = checkRate(ip);
  const headers = rateLimitHeaders(rate.remaining);
  if (rate.limited) {
    return new NextResponse(null, { status: 204, headers });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new NextResponse(null, { status: 204, headers });
  }

  if (!body || typeof body !== "object") {
    return new NextResponse(null, { status: 204, headers });
  }

  const raw = body as Record<string, unknown>;
  const safe = {
    message: clamp(raw.message),
    stack: clamp(raw.stack),
    digest: clamp(raw.digest),
    pathname: clamp(raw.pathname),
    userAgent: clamp(req.headers.get("user-agent") ?? undefined),
  };

  if (!safe.message && !safe.stack) {
    return new NextResponse(null, { status: 204, headers });
  }

  log.error(
    {
      event: "client.error",
      ...safe,
    },
    `client error on ${safe.pathname ?? "(unknown path)"}: ${safe.message ?? "(no message)"}`,
  );

  // Direkter HTTP-POST nach BetterStack (Phase-1-Bruecke auf Vercel):
  // Der Pino-Transport-Worker findet `@logtail/pino` im Lambda-Bundle
  // nicht (Sprint-9-Erkenntnis, siehe lib/logger.ts). Statt dem
  // Worker-Pfad schicken wir das Event hier direkt per fetch — kein
  // Worker, kein Modul-Resolve-Problem. AbortController schneidet bei
  // 2 s ab, damit die Lambda nicht auf BetterStack-Ausfall wartet.
  // Best-effort (Fail = stiller Drop, damit der Reporter nicht selbst
  // zum Fehler wird).
  const ingestHost = process.env.LOGTAIL_INGESTING_HOST?.trim();
  const sourceToken = process.env.LOGTAIL_SOURCE_TOKEN?.trim();
  if (ingestHost && sourceToken && process.env.VERCEL) {
    const event = {
      dt: new Date().toISOString(),
      level: "error",
      service: "ufiso-storefront-tropfshop",
      env: process.env.NODE_ENV || "production",
      component: "client-error",
      event_name: "client.error",
      ...safe,
      message: `client error on ${safe.pathname ?? "(unknown path)"}: ${safe.message ?? "(no message)"}`,
    };
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), BETTERSTACK_FETCH_TIMEOUT_MS);
    void fetch(`https://${ingestHost}/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${sourceToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
      signal: ctrl.signal,
    })
      .catch(() => {
        // Stiller Drop — Reporter darf nicht selbst zur Fehlerquelle werden.
      })
      .finally(() => clearTimeout(timer));
  }

  return new NextResponse(null, { status: 204, headers });
}

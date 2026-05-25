import { NextResponse, type NextRequest } from "next/server";
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
 *  - Body wird strikt geparst, fremde Felder fallen raus.
 *  - Pino-`redact` aus lib/logger.ts redigiert PII zentral.
 *
 * Response: 204 No Content (auch bei Validation-Fail — kein Nutzwert fuer
 * potenzielle Angreifer, ein Fehler-Reporter-Endpoint zu probieren).
 */

const log = createComponentLogger("client-error");

const MAX_FIELD_LENGTH = 8_000;

function clamp(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  if (value.length === 0) return undefined;
  return value.length > MAX_FIELD_LENGTH ? value.slice(0, MAX_FIELD_LENGTH) : value;
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new NextResponse(null, { status: 204 });
  }

  if (!body || typeof body !== "object") {
    return new NextResponse(null, { status: 204 });
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
    return new NextResponse(null, { status: 204 });
  }

  log.error(
    {
      event: "client.error",
      ...safe,
    },
    `client error on ${safe.pathname ?? "(unknown path)"}: ${safe.message ?? "(no message)"}`,
  );

  return new NextResponse(null, { status: 204 });
}

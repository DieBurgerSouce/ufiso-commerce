import { NextResponse, type NextRequest } from "next/server";
import { createComponentLogger } from "@/lib/logger";
import { hasErrorTrackingConsent } from "@/lib/consent";

/**
 * POST /api/log-client-error
 *
 * Nimmt Browser-Error-Reports von app/global-error.tsx + freier Reports von
 * Error-Boundaries entgegen und leitet sie an den Server-Pino-Logger weiter.
 * Server-Pino schreibt strukturierte JSON-Lines nach stdout + (optional)
 * BetterStack — Browser-Errors landen damit am selben Ziel wie Backend-Errors.
 *
 * Eigentlich KEIN PII (Stack-Traces sind technisch). Trotzdem:
 * - Body wird strikt geparst, fremde Felder weggeworfen.
 * - Klaro-Consent-Hook (Stub, Sprint-Klaro pending). Stub gibt aktuell `true`.
 * - Pino-`redact` aus lib/logger.ts greift zusaetzlich, falls doch was
 *   durchrutscht (Cookies/Authorization in Headern z.B.).
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
  if (!hasErrorTrackingConsent()) {
    return new NextResponse(null, { status: 204 });
  }

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

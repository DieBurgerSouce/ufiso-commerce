import { NextResponse } from "next/server";

/**
 * Newsletter-Anmeldung Hofladen (Pre-Launch) via Brevo — Double-Opt-In.
 *
 * Unterschied zur Tropfshop-Variante: liest `BREVO_HOFLADEN_LIST_ID` statt
 * `BREVO_NEWSLETTER_LIST_ID`. Damit kann ein BREVO_API_KEY auf einer
 * Brevo-Instanz beide Brands bedienen (zwei verschiedene Listen).
 *
 * Benoetigte Env (siehe .env.local.template):
 *   BREVO_API_KEY            — API-Key aus dem Brevo-Account
 *   BREVO_HOFLADEN_LIST_ID   — Listen-ID "Hofladen Newsletter"
 *   BREVO_DOI_TEMPLATE_ID    — ID des DOI-Bestaetigungs-Templates
 *   BREVO_DOI_REDIRECT_URL   — Ziel-URL nach Bestaetigung
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(request: Request) {
  let payload: { email?: unknown; source?: unknown; website?: unknown };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Ungültige Anfrage." },
      { status: 400 },
    );
  }

  const email = typeof payload.email === "string" ? payload.email.trim() : "";
  const source =
    typeof payload.source === "string" ? payload.source : "storefront-hofladen";
  const honeypot =
    typeof payload.website === "string" ? payload.website.trim() : "";

  if (honeypot.length > 0) {
    console.warn("[newsletter] Honeypot ausgeloest, Submit verworfen.");
    return NextResponse.json({
      message:
        "Fast geschafft — bitte bestätigen Sie Ihre Anmeldung über den Link in der E-Mail.",
    });
  }

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      { message: "Bitte geben Sie eine gültige E-Mail-Adresse ein." },
      { status: 422 },
    );
  }

  const apiKey = process.env.BREVO_API_KEY;
  const listId = Number(process.env.BREVO_HOFLADEN_LIST_ID);
  const templateId = Number(process.env.BREVO_DOI_TEMPLATE_ID);
  const redirectionUrl = process.env.BREVO_DOI_REDIRECT_URL;

  if (!apiKey || !listId || !templateId || !redirectionUrl) {
    console.error("[newsletter] Brevo ist nicht vollständig konfiguriert.");
    return NextResponse.json(
      {
        message:
          "Die Newsletter-Anmeldung ist gerade nicht verfügbar. Bitte versuchen Sie es später erneut.",
      },
      { status: 503 },
    );
  }

  try {
    const res = await fetch(
      "https://api.brevo.com/v3/contacts/doubleOptinConfirmation",
      {
        method: "POST",
        headers: {
          "api-key": apiKey,
          "Content-Type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify({
          email,
          includeListIds: [listId],
          templateId,
          redirectionUrl,
          attributes: { OPT_IN_SOURCE: source },
        }),
      },
    );

    if (res.ok) {
      return NextResponse.json({
        message:
          "Fast geschafft — bitte bestätigen Sie Ihre Anmeldung über den Link in der E-Mail.",
      });
    }

    const error: { code?: string; message?: string } = await res
      .json()
      .catch(() => ({}));

    if (res.status === 400 && error.code === "duplicate_parameter") {
      return NextResponse.json({
        message: "Sie sind bereits für unseren Newsletter angemeldet.",
      });
    }

    console.error("[newsletter] Brevo-Fehler:", res.status, error);
    return NextResponse.json(
      {
        message:
          "Das hat leider nicht geklappt. Bitte versuchen Sie es später erneut.",
      },
      { status: 502 },
    );
  } catch (err) {
    console.error("[newsletter] Brevo nicht erreichbar:", err);
    return NextResponse.json(
      {
        message:
          "Das hat leider nicht geklappt. Bitte versuchen Sie es später erneut.",
      },
      { status: 502 },
    );
  }
}

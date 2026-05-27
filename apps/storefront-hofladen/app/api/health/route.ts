import { NextResponse } from "next/server";
import { createComponentLogger } from "@/lib/logger";

/**
 * GET /api/health — Hofladen-Storefront-Readiness.
 * Identisch zur Tropfshop-Variante: proxified das Backend-/health
 * (DB + Redis) mit 1.5s AbortController.
 */

const log = createComponentLogger("health");

const BACKEND_FETCH_TIMEOUT_MS = 1500;

export const dynamic = "force-dynamic";

export async function GET() {
  const start = Date.now();
  const backendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL;

  if (!backendUrl) {
    log.warn(
      { event: "health.fail", reason: "missing_backend_url" },
      "/api/health fail: NEXT_PUBLIC_MEDUSA_BACKEND_URL not set",
    );
    return NextResponse.json(
      { status: "fail", reason: "NEXT_PUBLIC_MEDUSA_BACKEND_URL not set" },
      { status: 503 },
    );
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), BACKEND_FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(`${backendUrl.replace(/\/$/, "")}/health`, {
      signal: controller.signal,
      cache: "no-store",
      headers: { accept: "application/json" },
    });

    const totalDurationMs = Date.now() - start;
    let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      // Backend-/health gibt ggf. text/plain. Body bleibt null.
    }

    if (res.ok) {
      log.info(
        { event: "health.ok", backendStatus: res.status, totalDurationMs },
        "/api/health ok",
      );
      return NextResponse.json(
        {
          status: "ok",
          durationMs: totalDurationMs,
          backend: body ?? { status: "ok" },
        },
        { status: 200 },
      );
    }

    log.warn(
      {
        event: "health.fail",
        backendStatus: res.status,
        totalDurationMs,
      },
      `/api/health fail: backend status=${res.status}`,
    );
    return NextResponse.json(
      {
        status: "fail",
        durationMs: totalDurationMs,
        backendStatus: res.status,
        backend: body,
      },
      { status: 503 },
    );
  } catch (err) {
    const totalDurationMs = Date.now() - start;
    const reason = err instanceof Error ? err.message : String(err);
    log.warn(
      { event: "health.fail", reason, totalDurationMs },
      `/api/health fail: ${reason}`,
    );
    return NextResponse.json(
      { status: "fail", reason, durationMs: totalDurationMs },
      { status: 503 },
    );
  } finally {
    clearTimeout(timer);
  }
}

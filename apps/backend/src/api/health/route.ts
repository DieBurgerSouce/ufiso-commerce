import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import Redis from "ioredis";
import { createComponentLogger, loggerConfigSnapshot } from "../../lib/logger";

// Minimales Knex-Interface — vermeidet einen breiten Typ-Import nur fuer .raw().
// Der eigentliche Type ist `Knex<any>` aus `@medusajs/framework/deps/mikro-orm-knex`,
// nicht re-exportiert.
type KnexLike = { raw: (sql: string) => Promise<unknown> };

/**
 * GET /health — Readiness-Probe.
 *
 * Sprint 6 (ADR-012 + ADR-013): ersetzt die Medusa-Default-Route, die nur
 * statisch 200 "OK" liefert. Diese Variante prueft tatsaechlich:
 *  - Postgres: SELECT 1 ueber den Medusa-Knex-Container.
 *  - Redis:    PING ueber kurzlebigen ioredis-Client an REDIS_URL.
 *
 * Strategie:
 *  - Beide Pings parallel mit harten Timeouts (je 800 ms, Gesamt-Budget <1 s).
 *  - 200 OK, wenn beide Probes innerhalb ihres Budgets gruen sind.
 *  - 503 sonst, mit Detail-Felder fuer Diagnose. Body ist klein und sicher
 *    fuer Public-Healthcheck-Konsumenten (kein Secret-Leak).
 *  - Eine Log-Line pro Request, Pino-strukturiert
 *    (`component:"health"`, `event:"health.ok|health.fail"`).
 *
 * CI: ci.yml wait-on http://localhost:9000/health. Wenn Redis-Service-Container
 * stirbt, muss diese Route 503 liefern — der wait-on-Step bleibt aussagekraeftig.
 */

const log = createComponentLogger("health");

const PROBE_TIMEOUT_MS = 800;
const REDIS_CONNECT_TIMEOUT_MS = 600;
const REDIS_COMMAND_TIMEOUT_MS = 600;

type ProbeResult =
  | { ok: true; durationMs: number }
  | { ok: false; durationMs: number; error: string };

async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string,
): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`${label} timed out after ${ms} ms`)),
      ms,
    );
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer!);
  }
}

async function probeDatabase(knex: KnexLike): Promise<ProbeResult> {
  const start = Date.now();
  try {
    await withTimeout(knex.raw("SELECT 1"), PROBE_TIMEOUT_MS, "db");
    return { ok: true, durationMs: Date.now() - start };
  } catch (err) {
    return {
      ok: false,
      durationMs: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function probeRedis(): Promise<ProbeResult> {
  const start = Date.now();
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    // Kein REDIS_URL → degraded, aber kein Total-Crash. Wir betrachten das als
    // Fehler in /health, weil Medusa-Event-Bus/Workflow-Engine ohne Redis nicht
    // zuverlaessig laufen. Coolify-Health-Probe soll das frueh aufdecken.
    return {
      ok: false,
      durationMs: Date.now() - start,
      error: "REDIS_URL not set",
    };
  }

  const client = new Redis(redisUrl, {
    connectTimeout: REDIS_CONNECT_TIMEOUT_MS,
    commandTimeout: REDIS_COMMAND_TIMEOUT_MS,
    lazyConnect: true,
    maxRetriesPerRequest: 0,
    enableReadyCheck: false,
    enableOfflineQueue: false,
    // Beim Health-Check keine Auto-Reconnect-Schleife.
    retryStrategy: () => null,
  });

  try {
    await withTimeout(client.connect(), REDIS_CONNECT_TIMEOUT_MS, "redis.connect");
    const pong = await withTimeout(
      client.ping(),
      REDIS_COMMAND_TIMEOUT_MS,
      "redis.ping",
    );
    if (pong !== "PONG") {
      return {
        ok: false,
        durationMs: Date.now() - start,
        error: `unexpected PING response: ${pong}`,
      };
    }
    return { ok: true, durationMs: Date.now() - start };
  } catch (err) {
    return {
      ok: false,
      durationMs: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    };
  } finally {
    // Verbindung sicher schliessen (nicht poolen — Health-Check ist kurzlebig).
    client.disconnect();
  }
}

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const start = Date.now();
  const knex = req.scope.resolve(
    ContainerRegistrationKeys.PG_CONNECTION,
  ) as unknown as KnexLike;

  const [db, redis] = await Promise.all([probeDatabase(knex), probeRedis()]);

  const ok = db.ok && redis.ok;
  const totalDurationMs = Date.now() - start;
  const status = ok ? 200 : 503;

  const body = {
    status: ok ? "ok" : "fail",
    durationMs: totalDurationMs,
    checks: {
      db: db.ok ? { ok: true, durationMs: db.durationMs } : db,
      redis: redis.ok ? { ok: true, durationMs: redis.durationMs } : redis,
    },
    logger: loggerConfigSnapshot(),
  };

  if (ok) {
    log.info({ event: "health.ok", checks: body.checks, totalDurationMs }, "/health ok");
  } else {
    log.warn(
      { event: "health.fail", checks: body.checks, totalDurationMs },
      `/health fail: db=${db.ok ? "ok" : "fail"}, redis=${redis.ok ? "ok" : "fail"}`,
    );
  }

  res.status(status).json(body);
};

// /health ist top-level (kein /admin- oder /store-Prefix) und hat damit kein
// default-Auth-Middleware. Konvention bei Kubernetes-Probes / Coolify / wait-on.

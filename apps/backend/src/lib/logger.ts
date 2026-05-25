import pino, {
  type Logger,
  type LoggerOptions,
  type TransportTargetOptions,
} from "pino";

/**
 * UFISO / Backend — strukturierter Pino-Logger.
 *
 * Laeuft PARALLEL zum eingebauten Medusa-Logger (winston-basiert). Wird in
 * Custom-Code (Skripten, API-Routes, instrumentation) verwendet — der
 * Medusa-Framework-Logger bleibt fuer Framework-Output zustaendig.
 *
 * Konfiguration via ENV:
 *   - LOG_LEVEL              (default "info"; "debug" lokal, "info" CI/Prod)
 *   - NODE_ENV               ("development" => pino-pretty, sonst JSON-Lines)
 *   - LOGTAIL_SOURCE_TOKEN   (BetterStack Logs; leer = no-op)
 *
 * Privacy (siehe ADR-013 + Logging-Observability.md):
 *   pino.redact zensiert Authorization-/Cookie-Header, Bestelldaten,
 *   E-Mail-Felder und Tokens. Keine Klartext-PII in Logs/BetterStack.
 *
 * Stack-Entscheidung: ADR-012 (Logging-Stack) + ADR-013 (Error-Tracking).
 */

const SERVICE_NAME = "ufiso-backend";

const REDACT_PATHS = [
  // Request-Header
  'req.headers.authorization',
  'req.headers.cookie',
  'req.headers["set-cookie"]',
  'headers.authorization',
  'headers.cookie',
  'headers["set-cookie"]',
  // Auth-/Token-Felder beliebiger Tiefe (Pino-Glob)
  '*.password',
  '*.token',
  '*.api_key',
  '*.apiKey',
  '*.secret',
  // PII-Felder
  '*.email',
  '*.customer_email',
  '*.shipping_address',
  '*.billing_address',
];

function detectLogLevel(): string {
  const raw = process.env.LOG_LEVEL?.toLowerCase().trim();
  const valid = new Set([
    "fatal",
    "error",
    "warn",
    "info",
    "debug",
    "trace",
    "silent",
  ]);
  if (raw && valid.has(raw)) return raw;
  return "info";
}

function buildLogger(): Logger {
  const isDev = process.env.NODE_ENV !== "production";
  const level = detectLogLevel();
  const betterstackToken = process.env.LOGTAIL_SOURCE_TOKEN?.trim();

  const baseOptions: LoggerOptions = {
    level,
    base: {
      service: SERVICE_NAME,
      env: process.env.NODE_ENV || "development",
    },
    redact: {
      paths: REDACT_PATHS,
      censor: "[REDACTED]",
      remove: false,
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  };

  const prettyTarget: TransportTargetOptions = {
    target: "pino-pretty",
    level,
    options: {
      colorize: true,
      translateTime: "SYS:HH:MM:ss.l",
      ignore: "pid,hostname,service,env",
      singleLine: false,
    },
  };

  const stdoutJsonTarget: TransportTargetOptions = {
    target: "pino/file",
    level,
    options: { destination: 1 },
  };

  const betterstackTarget: TransportTargetOptions | null = betterstackToken
    ? {
        target: "@logtail/pino",
        level,
        options: { sourceToken: betterstackToken },
      }
    : null;

  const targets: TransportTargetOptions[] = [];
  targets.push(isDev ? prettyTarget : stdoutJsonTarget);
  if (betterstackTarget) targets.push(betterstackTarget);

  // Single-target nutzt pino.transport direkt; multi-target via { targets:[] }.
  // pino()-Logger mit Worker-Thread-Transport.
  return pino(baseOptions, pino.transport({ targets }));
}

export const rootLogger: Logger = buildLogger();

/**
 * Erzeugt einen Child-Logger mit fester Komponenten-Bindung.
 *
 * Convention: jeder Custom-Bereich (Script, API-Route, Worker) bekommt
 * einen eigenen Component-Namen — so sind Logs spaeter in BetterStack /
 * grep nach `component=foundation-seed` filterbar.
 */
export function createComponentLogger(
  component: string,
  bindings: Record<string, unknown> = {},
): Logger {
  return rootLogger.child({ component, ...bindings });
}

/**
 * Konfig-Snapshot fuer Diagnose-/Smoke-Endpoints. Enthaelt KEIN Token,
 * nur ob es gesetzt ist (boolean).
 */
export function loggerConfigSnapshot(): {
  level: string;
  env: string;
  betterstack: boolean;
} {
  return {
    level: detectLogLevel(),
    env: process.env.NODE_ENV || "development",
    betterstack: Boolean(process.env.LOGTAIL_SOURCE_TOKEN?.trim()),
  };
}

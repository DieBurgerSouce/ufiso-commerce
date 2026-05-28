import "server-only";
import pino, {
  type Logger,
  type LoggerOptions,
  type TransportTargetOptions,
} from "pino";

/**
 * UFISO / Storefront-Hofladen — strukturierter Pino-Logger (server-only).
 * Spiegelt das Tropfshop-Setup (apps/storefront-tropfshop/lib/logger.ts);
 * BetterStack-Source ist eine eigene Source pro Brand (Goal: getrennte
 * Log-Streams, sodass Filter pro Brand moeglich sind).
 *
 * Stack-Entscheidung: [[ADR-012-Logging-Stack]] + [[ADR-013-Error-Tracking]].
 */

const SERVICE_NAME = "ufiso-storefront-hofladen";

const REDACT_PATHS = [
  "req.headers.authorization",
  "req.headers.cookie",
  'req.headers["set-cookie"]',
  "headers.authorization",
  "headers.cookie",
  'headers["set-cookie"]',
  "*.password",
  "*.token",
  "*.api_key",
  "*.apiKey",
  "*.secret",
  "*.email",
  "*.customer_email",
  "*.shipping_address",
  "*.billing_address",
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
  const isVercel = !!process.env.VERCEL;
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

  // Auf Vercel: stdout-JSON ausgeben + Vercel-Log-Drain -> BetterStack.
  // Lokal/Hetzner: direkter Pino-Transport.
  const useBetterstackTransport = !!betterstackToken && !isVercel;
  const betterstackTarget: TransportTargetOptions | null =
    useBetterstackTransport
      ? {
          target: "@logtail/pino",
          level,
          options: { sourceToken: betterstackToken },
        }
      : null;

  const targets: TransportTargetOptions[] = [];
  targets.push(isDev ? prettyTarget : stdoutJsonTarget);
  if (betterstackTarget) targets.push(betterstackTarget);

  return pino(baseOptions, pino.transport({ targets }));
}

export const rootLogger: Logger = buildLogger();

export function createComponentLogger(
  component: string,
  bindings: Record<string, unknown> = {},
): Logger {
  return rootLogger.child({ component, ...bindings });
}

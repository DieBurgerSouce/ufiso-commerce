// UFISO / Tropfshop — Backend-Instrumentierung.
//
// Medusa v2 ruft `register()` einmalig beim Boot auf (siehe
// https://docs.medusajs.com/learn/debugging-and-testing/instrumentation).
//
// Sprint 6 (ADR-012 + ADR-013): wir registrieren Process-Level-Handler fuer
// `uncaughtException` und `unhandledRejection`, damit auch Crashes ueber den
// Pino-Logger (und damit ueber den BetterStack-Transport, falls Token gesetzt)
// gemeldet werden — nicht nur im stdout-Puffer verloren gehen.
//
// OpenTelemetry bleibt bewusst aus (out of scope Phase 1, siehe ADR-012).

import { rootLogger } from "./src/lib/logger";

export function register() {
  process.on("uncaughtException", (err) => {
    rootLogger.fatal(
      {
        event: "process.uncaughtException",
        err: { name: err.name, message: err.message, stack: err.stack },
      },
      `uncaughtException: ${err.message}`,
    );
    // Pino-Worker-Transports sind async; minimaler Delay vor Process-Exit,
    // damit das Log noch durch den Worker-Thread geht. 200 ms reicht
    // praktisch — laenger wuerde Container-Restarter ungeduldig machen.
    setTimeout(() => process.exit(1), 200).unref();
  });

  process.on("unhandledRejection", (reason) => {
    const err = reason instanceof Error ? reason : new Error(String(reason));
    rootLogger.fatal(
      {
        event: "process.unhandledRejection",
        err: { name: err.name, message: err.message, stack: err.stack },
      },
      `unhandledRejection: ${err.message}`,
    );
  });

  rootLogger.info(
    {
      event: "process.start",
      node: process.version,
      pid: process.pid,
    },
    "instrumentation registered (pino-logger + process handlers)",
  );
}

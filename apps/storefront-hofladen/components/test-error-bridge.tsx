"use client";

import { useEffect } from "react";
import {
  reportClientError,
  type ClientErrorReport,
} from "@/lib/report-client-error";

/**
 * E2E-Bruecke: stellt `window.__reportClientError` bereit fuer Playwright-
 * Helper-Calls. Identische Semantik zur Tropfshop-Variante; respektiert
 * den Hofladen-Klaro-Cookie via `report-client-error.ts`.
 */
export function TestErrorBridge() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const w = window as Window & {
      __reportClientError?: (report: ClientErrorReport) => Promise<void>;
    };
    w.__reportClientError = reportClientError;
    return () => {
      delete w.__reportClientError;
    };
  }, []);
  return null;
}

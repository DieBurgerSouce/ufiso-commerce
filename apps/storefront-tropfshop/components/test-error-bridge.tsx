"use client";

import { useEffect } from "react";
import {
  reportClientError,
  type ClientErrorReport,
} from "@/lib/report-client-error";

/**
 * E2E-Bruecke: stellt `window.__reportClientError` bereit, damit Playwright
 * die echte Reporter-Funktion (inklusive Consent-Gate) ohne den
 * React-Render-Error-Mechanismus aufrufen kann.
 *
 * Warum kein "test-only"-Flag? Die Funktion macht nichts, was ein
 * Angreifer nicht ohnehin selbst per `fetch` ausloesen koennte — sie
 * respektiert den Klaro-Cookie und gated darueber. Sie hier ueberall
 * verfuegbar zu haben vereinfacht Debugging und Tests, ohne ein
 * Sicherheits- oder Privacy-Risiko zu schaffen.
 *
 * Es wird KEIN Snippet automatisch ausgeloest — der Helper ist passiv und
 * muss aktiv aufgerufen werden.
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

"use client";

import { useId, useState } from "react";

type Status = "idle" | "loading" | "success" | "error";

export function NewsletterForm() {
  const emailId = useId();
  const consentId = useId();
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "loading") return;

    const form = event.currentTarget;
    const data = new FormData(form);
    const email = String(data.get("email") ?? "").trim();

    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "pre-launch" }),
      });
      const body: { message?: string } = await res.json().catch(() => ({}));

      if (!res.ok) {
        setStatus("error");
        setMessage(
          body.message ??
            "Das hat leider nicht geklappt. Bitte versuchen Sie es später erneut.",
        );
        return;
      }

      setStatus("success");
      setMessage(
        body.message ??
          "Fast geschafft — bitte bestätigen Sie Ihre Anmeldung über den Link in der E-Mail.",
      );
      form.reset();
    } catch {
      setStatus("error");
      setMessage(
        "Verbindung fehlgeschlagen. Bitte prüfen Sie Ihre Internetverbindung.",
      );
    }
  }

  if (status === "success") {
    return (
      <p
        role="status"
        className="rounded-xl border border-accent/30 bg-accent/10 px-4 py-4 text-sm text-neutral-100"
      >
        {message}
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor={emailId} className="sr-only">
          E-Mail-Adresse
        </label>
        <input
          id={emailId}
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="ihre@email.de"
          className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-neutral-100 placeholder:text-neutral-500 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="shrink-0 rounded-xl bg-accent px-5 py-3 font-semibold text-neutral-950 transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-accent/50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "loading" ? "Wird gesendet…" : "Benachrichtigen"}
        </button>
      </div>

      <label
        htmlFor={consentId}
        className="flex items-start gap-2 text-xs leading-relaxed text-neutral-400"
      >
        <input
          id={consentId}
          name="consent"
          type="checkbox"
          required
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/20 bg-white/5 accent-accent"
        />
        <span>
          Ich möchte den Tropfshop-Newsletter erhalten und kann mich jederzeit
          abmelden. Es gilt die doppelte Bestätigung per E-Mail.
        </span>
      </label>

      {status === "error" && (
        <p role="alert" className="text-sm text-red-400">
          {message}
        </p>
      )}
    </form>
  );
}

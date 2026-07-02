"use client";

import { useState } from "react";
import { validateEmail } from "@/lib/quiz-validation";

/**
 * Step-9 email capture (docs/05): email + a SEPARATE unchecked marketing
 * consent checkbox (docs/08 §4). The honeypot field must stay empty.
 */

export function EmailStep({
  settings,
  submitting,
  submitError,
  onSubmit,
}: {
  settings: {
    button_label?: string;
    consent_label?: string;
    reassurance?: string;
    placeholder?: string;
  };
  submitting: boolean;
  submitError: string | null;
  onSubmit: (data: { email: string; consent: boolean; website: string }) => void;
}) {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState(""); // honeypot
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    const problem = validateEmail(email);
    setError(problem);
    if (!problem) onSubmit({ email: email.trim(), consent, website });
  }

  return (
    <form onSubmit={submit} noValidate>
      <input
        type="email"
        inputMode="email"
        autoComplete="email"
        enterKeyHint="go"
        autoFocus
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (error) setError(null);
        }}
        placeholder={settings.placeholder ?? "you@example.com"}
        aria-label="Email address"
        aria-invalid={Boolean(error)}
        className="w-full rounded-card border border-ink-700 bg-ink-900 px-5 py-4 text-center text-xl text-paper-100 placeholder:text-paper-300/40"
      />

      {/* honeypot — real people never see or fill this */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </label>
      </div>

      {error || submitError ? (
        <p role="alert" className="mt-3 text-center text-sm text-gold-200">
          {error ?? submitError}
        </p>
      ) : null}

      <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-card border border-ink-700 bg-ink-900/60 px-4 py-3.5">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0 accent-(--gold-400)"
        />
        <span className="text-sm leading-snug text-paper-300">
          {settings.consent_label ??
            "Send me my reading plus weekly number guidance. Unsubscribe anytime."}
        </span>
      </label>

      <button
        type="submit"
        disabled={submitting}
        className="mt-6 block w-full rounded-card bg-gold-400 px-6 py-4 text-center text-lg font-medium text-ink-950 transition-transform duration-150 hover:bg-gold-200 active:scale-[0.98] disabled:opacity-60"
      >
        {submitting ? "Unlocking your reading…" : (settings.button_label ?? "Reveal my reading")}
      </button>

      <p className="mt-4 text-center text-xs text-paper-300/80">
        {settings.reassurance ?? "Free forever. No spam. Your data stays private."}
      </p>
    </form>
  );
}

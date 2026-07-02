"use client";

import { useEffect, useState } from "react";
import { getConsent, setConsent } from "@/lib/consent";

/** First-visit consent banner (docs/08 §4). Copy comes from CMS settings. */
export function ConsentBanner({ copy }: { copy: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(getConsent() === null);
  }, []);

  if (!visible) return null;

  function choose(choice: "accepted" | "essential") {
    setConsent(choice);
    setVisible(false);
  }

  return (
    <div
      role="region"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-ink-700 bg-ink-900/97 p-4 backdrop-blur-sm"
    >
      <div className="mx-auto max-w-md md:max-w-lg">
        <p className="text-sm leading-snug text-paper-300">{copy}</p>
        <div className="mt-3 flex gap-3">
          <button
            type="button"
            onClick={() => choose("accepted")}
            className="flex-1 rounded-card bg-gold-400 px-4 py-2.5 text-sm font-medium text-ink-950 hover:bg-gold-200"
          >
            Accept
          </button>
          <button
            type="button"
            onClick={() => choose("essential")}
            className="flex-1 rounded-card border border-ink-700 px-4 py-2.5 text-sm text-paper-300 hover:border-paper-300/50"
          >
            Essential only
          </button>
        </div>
      </div>
    </div>
  );
}

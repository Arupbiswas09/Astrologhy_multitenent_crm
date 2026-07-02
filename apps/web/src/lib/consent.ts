"use client";

/**
 * Consent state (docs/08 §4): "accepted" loads marketing pixels; "essential"
 * keeps only cookieless Plausible. Stored in localStorage `an_consent`.
 */

export type ConsentChoice = "accepted" | "essential";

const KEY = "an_consent";
const EVENT = "an-consent-change";

export function getConsent(): ConsentChoice | null {
  try {
    const value = localStorage.getItem(KEY);
    return value === "accepted" || value === "essential" ? value : null;
  } catch {
    return null;
  }
}

export function setConsent(choice: ConsentChoice): void {
  try {
    localStorage.setItem(KEY, choice);
  } catch {
    /* private mode — banner will reappear next visit */
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: choice }));
}

export function onConsentChange(callback: (choice: ConsentChoice) => void): () => void {
  const handler = (event: Event) => callback((event as CustomEvent<ConsentChoice>).detail);
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}

"use client";

import { useEffect, useRef, useState } from "react";
import { track } from "@/lib/analytics";

/**
 * Newsletter co-registration slot (docs/06 §1.9, docs/08 §2): renders the
 * tenant's raw embed snippet, lazily, only when the slot scrolls into view.
 * Geo-gating happened on the server — this component only mounts for
 * US/GB/CA visitors. The embed code is CMS-admin-trusted content.
 */
export function CoRegSlot({ embedCode, tenantSlug }: { embedCode: string; tenantSlug: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    if (!visible || !host) return;
    track("coreg_impression", { tenant: tenantSlug });

    // Inject the snippet and re-execute any <script> tags it contains
    // (innerHTML alone never runs scripts).
    host.innerHTML = embedCode;
    const scripts = Array.from(host.querySelectorAll("script"));
    for (const old of scripts) {
      const script = document.createElement("script");
      for (const attr of Array.from(old.attributes)) {
        script.setAttribute(attr.name, attr.value);
      }
      script.text = old.text;
      old.replaceWith(script);
    }

    const onClick = () => track("coreg_click", { tenant: tenantSlug });
    host.addEventListener("click", onClick);
    return () => host.removeEventListener("click", onClick);
  }, [visible, embedCode, tenantSlug]);

  return (
    <div className="rounded-card border border-ink-700 bg-ink-900 p-5">
      <p className="mb-3 text-center font-annotation text-xl text-gold-400">
        Readers like you also love…
      </p>
      <div ref={hostRef} className="min-h-24" />
    </div>
  );
}

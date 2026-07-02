"use client";

import { useEffect, useRef } from "react";

/**
 * `constellation-settle` section reveal (docs/07 §5) — progressive
 * enhancement version. Server HTML is fully visible (no-JS and pre-hydration
 * readers lose nothing); after hydration, sections still below the viewport
 * are hidden and drift in once on scroll. Reduced motion: no effect at all.
 */
export function RevealSection({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Never hide something the reader can already see.
    if (el.getBoundingClientRect().top < window.innerHeight * 0.9) return;

    el.classList.add("reveal-pending");
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          el.classList.add("reveal-shown");
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className={`reveal ${className ?? ""}`}>
      {children}
    </section>
  );
}

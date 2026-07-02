"use client";

import { LazyMotion, domAnimation } from "framer-motion";

/**
 * LazyMotion with the slim `domAnimation` feature set only (docs/02 §5 —
 * keeps the quiz-route bundle inside the 150KB budget). All animated
 * components must use `m.*`, never `motion.*`.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      {children}
    </LazyMotion>
  );
}

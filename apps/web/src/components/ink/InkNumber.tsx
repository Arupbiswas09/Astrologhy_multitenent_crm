"use client";

import { m, useReducedMotion } from "framer-motion";
import {
  DIGIT_H,
  DIGIT_PATHS,
  DIGIT_W,
  DOT_LINKS,
  constellationDots,
  digitsOf,
  ellipsePath,
} from "./digit-paths";

export interface InkNumberProps {
  value: number;
  /** Rendered height in px (width scales with digit count). */
  size?: number;
  /** Draw on mount, when scrolled into view, or render fully drawn. */
  animate?: "mount" | "in-view" | "none";
  withCircle?: boolean;
  withDots?: boolean;
  /** Base delay (s) before the digit stroke starts. */
  delay?: number;
  /** Digit draw duration (s) — spec default 2.2 (docs/07 §5). */
  drawDuration?: number;
  className?: string;
  "aria-hidden"?: boolean;
}

const EASE_OUT: [number, number, number, number] = [0.22, 0.8, 0.36, 1];

/**
 * The Living Number — the user's number drawn as a gold ink stroke, circled
 * by a hand-drawn ellipse, with constellation dots settling around it
 * (docs/07 §4). Decorative timing is skipped under prefers-reduced-motion.
 */
export function InkNumber({
  value,
  size = 180,
  animate = "mount",
  withCircle = true,
  withDots = true,
  delay = 0,
  drawDuration = 2.2,
  className,
  "aria-hidden": ariaHidden,
}: InkNumberProps) {
  const reduced = useReducedMotion();
  const digits = digitsOf(value);
  const contentW = digits.length * DIGIT_W;
  const pad = 16;
  const viewBox = `${-pad} ${-pad} ${contentW + pad * 2} ${DIGIT_H + pad * 2}`;
  const dots = constellationDots(contentW);

  const isStatic = reduced || animate === "none";
  const inView = animate === "in-view" && !isStatic;

  const rootProps = inView
    ? { initial: "hidden" as const, whileInView: "shown" as const, viewport: { once: true, amount: 0.5 } }
    : { initial: isStatic ? ("shown" as const) : ("hidden" as const), animate: "shown" as const };

  const circleDelay = delay + drawDuration * 0.82;
  const dotsDelay = circleDelay + 0.45;

  return (
    <m.svg
      viewBox={viewBox}
      style={{ height: size, width: (size * (contentW + pad * 2)) / (DIGIT_H + pad * 2) }}
      fill="none"
      role="img"
      aria-hidden={ariaHidden}
      aria-label={ariaHidden ? undefined : `The number ${value} drawn in gold ink`}
      className={className}
      overflow="visible"
      {...rootProps}
    >
      {digits.map((digit, i) => (
        <m.path
          key={`${digit}-${i}`}
          d={DIGIT_PATHS[digit]}
          transform={i > 0 ? `translate(${i * DIGIT_W} 0)` : undefined}
          stroke="var(--gold-400)"
          strokeWidth={7}
          strokeLinecap="round"
          strokeLinejoin="round"
          variants={{
            hidden: { pathLength: 0.001, opacity: 1 },
            shown: {
              pathLength: 1,
              opacity: 1,
              transition: {
                pathLength: { duration: drawDuration, ease: EASE_OUT, delay: delay + i * 0.35 },
              },
            },
          }}
        />
      ))}

      {withCircle ? (
        <m.path
          d={ellipsePath(contentW)}
          stroke="var(--gold-400)"
          strokeOpacity={0.85}
          strokeWidth={3}
          strokeLinecap="round"
          variants={{
            hidden: { pathLength: 0.001, opacity: 0 },
            shown: {
              pathLength: 1,
              opacity: 1,
              transition: {
                pathLength: { duration: 0.8, ease: "easeInOut", delay: circleDelay },
                opacity: { duration: 0.01, delay: circleDelay },
              },
            },
          }}
        />
      ) : null}

      {withDots ? (
        <>
          {DOT_LINKS.map(([a, b]) => {
            const from = dots[a];
            const to = dots[b];
            if (!from || !to) return null;
            return (
              <m.line
                key={`link-${a}-${b}`}
                x1={from[0]}
                y1={from[1]}
                x2={to[0]}
                y2={to[1]}
                stroke="var(--gold-200)"
                strokeOpacity={0.35}
                strokeWidth={1}
                variants={{
                  hidden: { opacity: 0 },
                  shown: { opacity: 1, transition: { duration: 0.5, delay: dotsDelay + 0.4 } },
                }}
              />
            );
          })}
          {dots.map(([x, y], i) => (
            <m.circle
              key={`dot-${i}`}
              cx={x}
              cy={y}
              r={2.4}
              fill="var(--gold-200)"
              variants={{
                hidden: { opacity: 0, scale: 0.4, y: -6 },
                shown: {
                  opacity: 0.9,
                  scale: 1,
                  y: 0,
                  transition: { duration: 0.5, ease: EASE_OUT, delay: dotsDelay + i * 0.07 },
                },
              }}
            />
          ))}
        </>
      ) : null}
    </m.svg>
  );
}

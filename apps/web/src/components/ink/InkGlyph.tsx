import { DIGIT_H, DIGIT_PATHS, DIGIT_W, digitsOf } from "./digit-paths";

/**
 * Static, server-renderable mini version of the Living Number — used as the
 * report's section bullet ("the number literally follows the user through
 * the report", docs/07 §4) and in landing cards. No animation, no JS.
 */
export function InkGlyph({
  value,
  size = 24,
  className,
  strokeWidth = 9,
}: {
  value: number;
  size?: number;
  className?: string;
  strokeWidth?: number;
}) {
  const digits = digitsOf(value);
  const w = digits.length * DIGIT_W;
  return (
    <svg
      viewBox={`-8 -8 ${w + 16} ${DIGIT_H + 16}`}
      style={{ height: size, width: (size * (w + 16)) / (DIGIT_H + 16) }}
      fill="none"
      aria-hidden
      className={className}
    >
      {digits.map((digit, i) => (
        <path
          key={`${digit}-${i}`}
          d={DIGIT_PATHS[digit]}
          transform={i > 0 ? `translate(${i * DIGIT_W} 0)` : undefined}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
}

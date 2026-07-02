import type { ReactNode } from "react";
import { Fragment } from "react";

/**
 * Strict-allowlist markdown → React (docs/06 §4: "escape everything else;
 * markdown rendered with a strict allowlist — no raw HTML from CMS").
 *
 * DECISION: hand-rolled instead of remark — the allowlist is tiny
 * (paragraphs, #/## headings, **bold**, *italic*, - lists) and JSX output
 * escapes by construction, so no HTML can pass through.
 */

function renderInline(text: string, keyBase: string): ReactNode[] {
  // **bold** first, then *italic* inside the remaining segments
  const nodes: ReactNode[] = [];
  const boldParts = text.split(/\*\*([^*]+)\*\*/g);
  boldParts.forEach((part, i) => {
    const key = `${keyBase}-b${i}`;
    if (i % 2 === 1) {
      nodes.push(<strong key={key}>{part}</strong>);
      return;
    }
    const italicParts = part.split(/\*([^*]+)\*/g);
    italicParts.forEach((seg, j) => {
      if (seg === "") return;
      nodes.push(j % 2 === 1 ? <em key={`${key}-i${j}`}>{seg}</em> : <Fragment key={`${key}-i${j}`}>{seg}</Fragment>);
    });
  });
  return nodes;
}

export function Markdown({ text, className }: { text: string; className?: string }) {
  const blocks = text
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);

  return (
    <div className={className}>
      {blocks.map((block, i) => {
        const key = `md-${i}`;
        if (block.startsWith("## ")) {
          return (
            <h3 key={key} className="mt-6 mb-2 font-display text-xl text-paper-100">
              {renderInline(block.slice(3), key)}
            </h3>
          );
        }
        if (block.startsWith("# ")) {
          return (
            <h2 key={key} className="mt-8 mb-3 font-display text-2xl text-paper-100">
              {renderInline(block.slice(2), key)}
            </h2>
          );
        }
        const lines = block.split("\n");
        if (lines.every((l) => l.trimStart().startsWith("- "))) {
          return (
            <ul key={key} className="mb-4 list-disc space-y-1 pl-5">
              {lines.map((l, j) => (
                <li key={`${key}-li${j}`}>{renderInline(l.trimStart().slice(2), `${key}-li${j}`)}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={key} className="mb-4 leading-relaxed">
            {renderInline(block.replace(/\n/g, " "), key)}
          </p>
        );
      })}
    </div>
  );
}

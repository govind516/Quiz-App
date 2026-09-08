"use client";

import React from "react";

/**
 * Renders quiz copy with lightweight code styling (no extra dependencies):
 * - fenced ``` blocks become a mono snippet block
 * - `inline` spans become inline <code> chips
 * Anything else renders as plain text (whitespace preserved).
 */
export function CodeText({
  text,
  className = "",
  inlineClassName = "",
  blockClassName = "",
}: {
  text: string;
  className?: string;
  inlineClassName?: string;
  blockClassName?: string;
}) {
  const parts = splitBlocks(text ?? "");
  return (
    <span className={className}>
      {parts.map((part, i) =>
        part.type === "block" ? (
          <pre
            key={i}
            data-testid="code-block"
            className={`mt-3 overflow-x-auto rounded-xl border border-white/10 bg-black/40 px-4 py-3 font-mono text-[13px] leading-relaxed text-[color:var(--mint)] ${blockClassName}`}
          >
            {part.text}
          </pre>
        ) : (
          <span key={i} className="whitespace-pre-wrap">
            {renderInline(part.text, inlineClassName)}
          </span>
        )
      )}
    </span>
  );
}

function splitBlocks(text: string): { type: "text" | "block"; text: string }[] {
  const out: { type: "text" | "block"; text: string }[] = [];
  const fence = /```(?:\w+)?\n?([\s\S]*?)```/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = fence.exec(text)) !== null) {
    if (m.index > last) out.push({ type: "text", text: text.slice(last, m.index) });
    out.push({ type: "block", text: m[1].replace(/^\n+|\s+$/g, "") });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ type: "text", text: text.slice(last) });
  if (out.length === 0) out.push({ type: "text", text });
  return out;
}

function renderInline(text: string, inlineClassName: string): React.ReactNode[] {
  const chunks = text.split(/(`[^`\n]+`)/g);
  return chunks.map((chunk, i) => {
    if (chunk.length > 2 && chunk.startsWith("`") && chunk.endsWith("`")) {
      return (
        <code
          key={i}
          data-testid="code-inline"
          className={`rounded-md border border-white/10 bg-white/[0.07] px-1.5 py-0.5 font-mono text-[0.9em] text-[color:var(--mint)] ${inlineClassName}`}
        >
          {chunk.slice(1, -1)}
        </code>
      );
    }
    return <React.Fragment key={i}>{chunk}</React.Fragment>;
  });
}

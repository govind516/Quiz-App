"use client";

import type { SelectHTMLAttributes } from "react";

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  children: React.ReactNode;
};

export function Select({ children, className = "", style, ...rest }: Props) {
  return (
    <div className="relative inline-flex items-center" style={{ display: "inline-flex" }}>
      <select
        className={`input !pr-9 ${className}`}
        style={{
          height: 40,
          padding: "0 36px 0 12px",
          borderRadius: "var(--radius-sm)",
          fontFamily: "var(--font-apple), sans-serif",
          appearance: "none" as const,
          backgroundImage: "none",
          ...style,
        }}
        {...rest}
      >
        {children}
      </select>
      <svg
        width={14}
        height={14}
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        className="pointer-events-none absolute right-3 text-faintc"
        style={{ color: "var(--color-faintc)" }}
        aria-hidden
      >
        <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

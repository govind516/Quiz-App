import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export function Eyebrow({ children }) {
  return (
    <div className="flex items-center gap-2 font-mono text-[11px] tracking-[0.22em] uppercase text-[color:var(--violet-2)]">
      <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--violet-2)]" />
      {children}
    </div>
  );
}

export function RevealHeading({ lines, className = '', delay = 0 }) {
  const reduce = useReducedMotion();
  return (
    <h1 className={className}>
      {lines.map((line, i) => (
        <span key={i} className="reveal-mask block">
          <motion.span
            initial={reduce ? { y: 0, opacity: 1 } : { y: '105%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: delay + i * 0.12, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="block will-change-transform"
            dangerouslySetInnerHTML={{ __html: line }}
          />
        </span>
      ))}
    </h1>
  );
}

export function FadeUp({ children, delay = 0, y = 24, className = '' }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? { opacity: 1 } : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ delay, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default RevealHeading;

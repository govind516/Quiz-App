import React from 'react';
import { motion } from 'framer-motion';

export function HexMark({ size = 28, glow = true }) {
  return (
    <span className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      {glow && (
        <motion.span
          aria-hidden
          className="absolute inset-0 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(167,139,250,0.55), transparent 70%)', filter: 'blur(10px)' }}
          animate={{ opacity: [0.55, 0.9, 0.55] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      <svg viewBox="0 0 40 44" width={size} height={size} className="relative">
        <defs>
          <linearGradient id="hg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#C4B5FD" />
            <stop offset="55%" stopColor="#8B7CF6" />
            <stop offset="100%" stopColor="#5B4BC4" />
          </linearGradient>
        </defs>
        <polygon points="20,2 37,12 37,32 20,42 3,32 3,12" fill="none" stroke="url(#hg)" strokeWidth="2" strokeLinejoin="round" />
        <polygon points="20,10 30,16 30,28 20,34 10,28 10,16" fill="url(#hg)" opacity="0.15" />
      </svg>
    </span>
  );
}

export function Wordmark({ size = 28 }) {
  return (
    <div className="flex items-center gap-2.5 select-none">
      <HexMark size={size} />
      <span className="font-display text-[22px] leading-none tracking-tight text-[color:var(--ink)]">Hex<span className="text-[color:var(--violet-2)]">Quiz</span></span>
    </div>
  );
}

export default HexMark;

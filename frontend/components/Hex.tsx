"use client";
import React from "react";
import { motion } from "framer-motion";

export function Hex({ size = 44, filled = false, color = "#8B7CF6", label }: { size?: number; filled?: boolean; color?: string; label?: string }) {
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size * 1.1 }}>
      <svg viewBox="0 0 40 44" width={size} height={size * 1.1}>
        <polygon
          points="20,2 37,12 37,32 20,42 3,32 3,12"
          fill={filled ? color : "transparent"}
          stroke={color}
          strokeOpacity={filled ? 0 : 0.45}
          strokeWidth={1.5}
        />
      </svg>
      {label && (
        <span className="absolute inset-0 flex items-center justify-center font-mono text-[10px] tracking-wider text-white/80">
          {label}
        </span>
      )}
    </div>
  );
}

export function HexRing({ size = 44, color = "#8B7CF6" }: { size?: number; color?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="relative inline-flex"
    >
      <Hex size={size} color={color} />
    </motion.div>
  );
}

export default Hex;

import React from 'react';

export default function Aurora({ variant = 'hero' }) {
  if (variant === 'soft') {
    return (
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="aurora-a animate-drift-a" style={{ width: 620, height: 620, left: '-10%', top: '-20%' }} />
        <div className="aurora-b animate-drift-b" style={{ width: 520, height: 520, right: '-10%', top: '10%' }} />
      </div>
    );
  }
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="aurora-a animate-drift-a" style={{ width: 780, height: 780, left: '-15%', top: '-25%' }} />
      <div className="aurora-b animate-drift-b" style={{ width: 620, height: 620, right: '-12%', top: '5%' }} />
      <div className="aurora-c animate-drift-c" style={{ width: 520, height: 520, left: '30%', bottom: '-30%' }} />
      <div className="absolute inset-0 grid-overlay" />
    </div>
  );
}

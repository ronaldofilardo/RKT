'use client';

import React from 'react';

type CourtType = 'CLAY' | 'HARD' | 'GRASS' | string;

const COURT_COLORS: Record<string, { bg: string; lines: string; label: string }> = {
  CLAY: { bg: '#c4623a', lines: '#ffffff', label: 'Saibro' },
  GRASS: { bg: '#2d8a3e', lines: '#ffffff', label: 'Grama' },
  HARD: { bg: '#1e4d7b', lines: '#ffffff', label: 'Dura' },
  default: { bg: '#1e4d7b', lines: '#ffffff', label: 'Dura' },
};

export default function CourtBackground({ courtType = 'HARD' }: { courtType?: CourtType }) {
  const colors = COURT_COLORS[courtType] ?? COURT_COLORS.default;

  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl"
      style={{ backgroundColor: colors.bg }}
    >
      {/* Net */}
      <div className="absolute inset-x-0 top-1/2 h-0.5 bg-white/60 -translate-y-1/2" />

      {/* Center line */}
      <div className="absolute inset-y-0 left-1/2 w-0.5 bg-white/40 -translate-x-1/2" />

      {/* Left service box */}
      <div className="absolute left-0 top-1/4 w-1/3 h-1/2 border-2 border-white/30" />
      {/* Right service box */}
      <div className="absolute right-0 top-1/4 w-1/3 h-1/2 border-2 border-white/30" />

      {/* Court label */}
      <div className="absolute bottom-2 right-3 text-white/40 text-[10px] font-medium uppercase tracking-wider">
        {colors.label}
      </div>
    </div>
  );
}
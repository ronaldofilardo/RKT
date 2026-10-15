'use client';

import type { RefObject } from 'react';

interface PlayerGamesColumnProps {
  name: string;
  value: string;
  isServing: boolean;
  isLeading: boolean;
  serverDotFirst: boolean;
  min: number;
  max: number;
  inputRef?: RefObject<HTMLInputElement>;
  onChange: (value: string) => void;
}

/** Coluna de games de um jogador (nome, marcador de sacador e input numérico). */
export function PlayerGamesColumn({
  name,
  value,
  isServing,
  isLeading,
  serverDotFirst,
  min,
  max,
  inputRef,
  onChange,
}: PlayerGamesColumnProps) {
  const dot = isServing ? (
    <span
      className="w-2 h-2 rounded-full bg-telemetry-volt flex-shrink-0 shadow-[0_0_8px_rgba(204,255,0,0.6)]"
      aria-label="Sacando"
      title="Sacando"
    />
  ) : null;
  const label = (
    <span className="truncate text-center" title={name}>
      {name}
    </span>
  );

  return (
    <div className="flex flex-col items-center gap-1.5 min-w-0">
      <div className="flex items-center justify-center gap-1.5 w-full text-xs font-semibold text-telemetry-text-primary px-1">
        {serverDotFirst ? dot : label}
        {serverDotFirst ? label : dot}
      </div>
      <input
        type="number"
        className={`w-20 text-center bg-telemetry-elevated border rounded-lg px-2 py-2 text-telemetry-text-primary text-base font-space-grotesk focus:outline-none focus:ring-2 focus:ring-telemetry-volt ${
          isLeading ? 'border-telemetry-volt' : 'border-white/10'
        }`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0"
        ref={inputRef}
        min={min}
        max={max}
        aria-label={`Games ${name}`}
      />
    </div>
  );
}

'use client';

import type { ReactNode } from 'react';

/** Célula de nome do jogador, com indicador de sacador (🎾) quando aplicável. */
export function MatchCardPlayerRow({
  name,
  isServer,
  serverTestId,
  barBg,
  children,
  setsWon,
}: {
  name: string;
  isServer: boolean;
  serverTestId: string;
  barBg: string;
  children?: ReactNode;
  setsWon?: number;
}) {
  return (
    <div style={{ display: 'table-row' }}>
      <div
        className="flex items-center px-3 py-1.5 font-semibold text-white text-sm"
        style={{ backgroundColor: barBg, color: '#ffffff', display: 'table-cell', whiteSpace: 'nowrap' }}
      >
        <span className="inline-flex items-center gap-2">
          <span className="text-white font-semibold">{name}</span>
          {isServer && (
            <span
              className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-black/75 border border-yellow-300 text-xs select-none shadow-md ring-1 ring-yellow-400/60"
              title="Sacador"
              aria-label="Sacador"
              role="img"
              data-testid={serverTestId}
            >
              🎾
            </span>
          )}
        </span>
      </div>
      {children}
      {setsWon !== undefined && (
        <div
          className="flex items-center justify-center px-3 py-1.5 font-space-grotesk tabular-nums text-lg font-bold text-white min-w-[2rem]"
          style={{ backgroundColor: barBg, color: '#ffffff', display: 'table-cell' }}
        >
          {setsWon}
        </div>
      )}
    </div>
  );
}

/** Célula de placar de um set ou de pontos do game. */
export function MatchCardScoreCell({
  bg,
  borderLeft,
  borderRight,
  children,
}: {
  bg: string;
  borderLeft?: string;
  borderRight?: string;
  children: ReactNode;
}) {
  return (
    <div
      className="flex items-center justify-center px-2 py-1.5 font-space-grotesk tabular-nums text-sm font-semibold text-white min-w-[2.5rem]"
      style={{
        backgroundColor: bg,
        color: '#ffffff',
        borderLeft,
        borderRight,
        ...(borderLeft ? { display: 'table-cell' as const } : {}),
      }}
    >
      {children}
    </div>
  );
}

/** Linha separadora branca entre os dois jogadores. */
export function MatchCardSeparator() {
  return (
    <div style={{ display: 'table-row' }}>
      <div className="h-[2px] bg-telemetry-elevated" style={{ display: 'table-cell', height: '2px', width: '100%' }} />
    </div>
  );
}

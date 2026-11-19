'use client';

import type { Vencedor } from './point-details-logic';

interface WinnerInfoProps {
  vencedor: Vencedor;
  winnerName: string;
}

export function WinnerInfo({ vencedor, winnerName }: WinnerInfoProps) {
  const isServer = vencedor === 'sacador';
  return (
    <div className="pd-header px-4 py-2.5 sm:px-5 sm:py-3 border-b border-white/10 bg-white/[0.04] flex items-center justify-between gap-2">
      <h2 className="font-bold text-white text-sm sm:text-base tracking-tight whitespace-nowrap">
        Vencedor do Ponto
      </h2>
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
          isServer
            ? 'bg-telemetry-blue/15 text-telemetry-blue-light border border-telemetry-blue/20'
            : 'bg-telemetry-orange/15 text-telemetry-orange-light border border-telemetry-orange/20'
        }`}
      >
        {isServer ? '🎾 Sacador' : '↩️ Devolvedor'} — {winnerName}
      </span>
    </div>
  );
}
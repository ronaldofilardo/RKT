'use client';

import type { Vencedor } from './point-details-logic';

interface WinnerInfoProps {
  vencedor: Vencedor;
  winnerName: string;
}

export function WinnerInfo({ vencedor, winnerName }: WinnerInfoProps) {
  return (
    <div className="pd-header px-5 py-4 border-b border-white/10 bg-white/[0.04]">
      <h2 className="text-center font-bold text-white" style={{ fontSize: '1.15rem' }}>
        Vencedor do Ponto
      </h2>
      <div className="flex justify-center mt-2">
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
            vencedor === 'sacador'
              ? 'bg-telemetry-blue/15 text-telemetry-blue-light'
              : 'bg-telemetry-orange/15 text-telemetry-orange-light'
          }`}
        >
          {vencedor === 'sacador' ? '🎾 Sacador' : '↩️ Devolvedor'} — {winnerName}
        </span>
      </div>
    </div>
  );
}
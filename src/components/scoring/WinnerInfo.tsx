'use client';

import type { Vencedor } from './point-details-logic';

interface WinnerInfoProps {
  vencedor: Vencedor;
  winnerName: string;
}

export function WinnerInfo({ vencedor, winnerName }: WinnerInfoProps) {
  return (
    <div className="pd-header px-5 py-4 border-b border-white/10" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}>
      <h2 className="text-center font-bold text-white" style={{ fontSize: '1.15rem' }}>
        Vencedor do Ponto
      </h2>
      <div className="flex justify-center mt-2">
        <span
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
          style={{
            backgroundColor: vencedor === 'sacador' ? 'rgba(59,130,246,0.15)' : 'rgba(249,115,22,0.15)',
            color: vencedor === 'sacador' ? '#60a5fa' : '#fb923c',
          }}
        >
          {vencedor === 'sacador' ? '🎾 Sacador' : '↩️ Devolvedor'} — {winnerName}
        </span>
      </div>
    </div>
  );
}
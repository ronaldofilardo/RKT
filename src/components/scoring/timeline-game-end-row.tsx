'use client';

import type { TimelinePoint } from '@/core/scoring/types';

/** Linha de placar final exibida após o último ponto de um game. */
export function GameEndRow({ point, winnerName, gameFinalScore, isBreak }: {
  point: TimelinePoint;
  winnerName: string;
  gameFinalScore: { player1: number; player2: number };
  isBreak: boolean;
}) {
  const scoreLabel = `${gameFinalScore.player1}x${gameFinalScore.player2}`;
  return (
    <tr
      data-testid={`game-end-${point.setNumber}-${point.pointNumber}`}
      aria-label={`Placar final do game: ${scoreLabel}`}
      className="bg-telemetry-elevated/70 border-y border-white/10 font-bold"
    >
      <td
        colSpan={3}
        className="px-1.5 py-1.5 text-[10px] text-telemetry-text-muted sticky left-0 bg-telemetry-elevated z-10 border-r border-white/10 text-right pr-3"
      >
        {point.isTiebreak ? 'Fim do Tiebreak' : 'Fim do Game'}
      </td>
      <td colSpan={2} className="px-1.5 py-1.5 text-[10px] text-center text-telemetry-text-primary border-r border-white/10">
        <span className="font-bold tracking-wide">{scoreLabel}</span>
      </td>
      <td colSpan={20} className="px-2 py-1.5 text-[10px] text-telemetry-text-muted font-normal">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-telemetry-text-primary">{winnerName}</span>
          {isBreak ? (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-semibold">
              Quebra de saque
            </span>
          ) : !point.isTiebreak ? (
            <span className="text-[9px] text-telemetry-text-muted/60">Confirmou o saque</span>
          ) : null}
          <span className="text-telemetry-text-muted/50 text-[9px]">· Placar final: {scoreLabel}</span>
        </div>
      </td>
    </tr>
  );
}

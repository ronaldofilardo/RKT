'use client';

import type { TimelinePoint } from '@/core/scoring/types';
import { usePlayerColors } from '@/components/ui/player-color.context';

/** Linha de placar final exibida após o último ponto de um game ou na entrada ao tiebreak. */
export function GameEndRow({ point, winnerName, winnerSide, gameFinalScore, isBreak, tiebreakStart }: {
  point: TimelinePoint;
  winnerName: string;
  winnerSide?: 'PLAYER_1' | 'PLAYER_2';
  gameFinalScore: { player1: number; player2: number };
  isBreak: boolean;
  /** true quando este game-end é a entrada para o tie-break do set. */
  tiebreakStart?: boolean;
}) {
  const colors = usePlayerColors();
  const winnerColor = winnerSide === 'PLAYER_1' ? colors.p1 : winnerSide === 'PLAYER_2' ? colors.p2 : 'text-telemetry-text-primary';
  const scoreLabel = `${gameFinalScore.player1}x${gameFinalScore.player2}`;
  const isMinibreak = point.isTiebreak && isBreak;
  const ariaLabel = tiebreakStart
    ? `Fim do game e início do tie break: ${scoreLabel}`
    : `Placar final do ${point.isTiebreak ? 'tiebreak' : 'game'}: ${scoreLabel}`;
  return (
    <tr
      data-testid={`game-end-${point.setNumber}-${point.pointNumber}`}
      aria-label={ariaLabel}
      className="bg-telemetry-elevated/70 border-y border-white/10 font-bold"
    >
      <td
        colSpan={3}
        className="px-1.5 py-1.5 text-[10px] text-telemetry-text-primary sticky left-0 bg-telemetry-elevated z-10 border-r border-white/10 text-right pr-3"
      >
        {tiebreakStart ? (
          <div className="flex flex-col items-end leading-tight">
            <span>Fim do Game</span>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-1">
            {point.isTiebreak ? 'Fim do Tiebreak' : 'Fim do Game'}
          </div>
        )}
      </td>
      <td colSpan={2} className="px-1.5 py-1.5 text-center text-telemetry-text-primary border-r border-white/10">
        <span className="font-bold tracking-wide">{scoreLabel}</span>
      </td>
      <td colSpan={20} className="px-2 py-1.5 text-[10px] text-telemetry-text-muted font-normal">
        <div className="flex items-center gap-2">
          <span className={`font-semibold ${winnerColor}`}>{winnerName}</span>
          {isBreak && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-semibold">
              {isMinibreak ? 'Minibreak' : 'Quebra de saque'}
            </span>
          )}
          {!tiebreakStart && !point.isTiebreak && !isBreak ? (
            <span className="text-[9px] text-telemetry-text-muted/60">Confirmou o saque</span>
          ) : null}
          {!tiebreakStart && (
            <span className="text-telemetry-text-muted/50 text-[9px]">· Placar final: {scoreLabel}</span>
          )}
        </div>
      </td>
    </tr>
  );
}

'use client';

import type { TennisFormat } from '@/lib/matchConfig';
import type { Player, ScoreboardSet } from './scoreboard-card.types';
import { getSetCellStyle, renderSetScore } from './scoreboard-card-cells';

interface ScoreboardPlayerRowProps {
  player: Player;
  side: 'player1' | 'player2';
  isWinner: boolean;
  isServing: boolean;
  isSuspended?: boolean;
  isLastRow?: boolean;
  displayedSets: ScoreboardSet[];
  currentSetIndex: number;
  numSets: number;
  tennisFormat?: TennisFormat;
  setsWon?: { player1: number; player2: number };
}

/** Linha de um jogador: nome, indicador de vencedor/sacador e cells de set. */
export function ScoreboardPlayerRow({
  player,
  side,
  isWinner,
  isServing,
  isSuspended,
  isLastRow = false,
  displayedSets,
  currentSetIndex,
  numSets,
  tennisFormat,
  setsWon,
}: ScoreboardPlayerRowProps) {
  const nameBg = isSuspended
    ? 'bg-telemetry-alert text-telemetry-base'
    : 'bg-telemetry-card text-telemetry-text-primary';
  const nameBorder = isLastRow ? '' : ' border-b border-white/10';
  const statusBorder = isLastRow ? 'border-l border-white/10' : 'border-l border-b border-white/10';

  return (
    <tr className="text-xs">
      <td title={player.name} className={`text-left py-1 px-2 font-bold tracking-wide whitespace-nowrap truncate${nameBorder} ${nameBg}`}>
        {player.name}
      </td>
      <td className={`text-center py-1 bg-telemetry-card ${statusBorder} text-xs`}>
        {isWinner ? (
          <span className="text-telemetry-volt font-bold text-sm">✓</span>
        ) : isServing ? (
          <span title="Sacador" aria-label="Sacador" role="img" className="text-xs select-none">🎾</span>
        ) : null}
      </td>
      {Array.from({ length: numSets }).map((_, i) => {
        const set = displayedSets[i];
        const isCurrent = i === currentSetIndex;
        const style = getSetCellStyle(set, side, isCurrent, tennisFormat, setsWon);

        return (
          <td
            key={i}
            className={`text-center px-1 py-1 text-sm font-space-grotesk font-semibold border-l border-b border-white/10 ${style}`}
          >
            {renderSetScore(set, side)}
          </td>
        );
      })}
    </tr>
  );
}

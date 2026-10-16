'use client';

import { isSetCompleted } from '@/app/match/[id]/scoring/scoringHelpers';
import type { TennisFormat } from '@/lib/matchConfig';
import type { Player, ScoreboardSet } from './scoreboard-card.types';

function getSetCellStyle(
  set: ScoreboardSet | undefined,
  player: 'player1' | 'player2',
  isCurrent: boolean,
  tennisFormat: TennisFormat | undefined,
  setsWon: { player1: number; player2: number } | undefined
) {
  if (!set) {
    return 'text-telemetry-text-muted bg-telemetry-card';
  }

  if (isCurrent) {
    return 'text-telemetry-volt font-bold bg-telemetry-elevated';
  }

  const isComplete = set && isSetCompleted(set, tennisFormat, undefined, setsWon);
  if (!isComplete) {
    return 'text-telemetry-text-muted bg-telemetry-card';
  }

  const playerWon = player === 'player1' ? set.player1 > set.player2 : set.player2 > set.player1;

  if (playerWon) {
    return 'text-white font-bold bg-telemetry-blue';
  } else {
    return 'text-telemetry-text-muted bg-telemetry-elevated';
  }
}

function renderSetScore(set: ScoreboardSet | undefined, player: 'player1' | 'player2') {
  if (!set) return '-';
  const score = set[player];
  if (set.tiebreakScore) {
    const tbScore = set.tiebreakScore[player];
    if (set.player1 <= 1 && set.player2 <= 1) {
      return tbScore;
    }
    return <span>{score}<sup className="text-[9px] leading-none opacity-80">{tbScore}</sup></span>;
  }
  return score;
}

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

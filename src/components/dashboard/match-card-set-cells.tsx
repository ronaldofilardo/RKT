'use client';

import { renderSetScore } from '@/components/scoring/scoreboard-card-cells';

interface SetCellsProps {
  displayedSets: Array<{
    player1: number;
    player2: number;
    isTiebreak?: boolean;
    tiebreakScore?: { player1: number; player2: number } | null;
  } | undefined>;
  isFinished: boolean;
  isWinner: boolean;
  isLiveOrSuspended: boolean;
  currentSetIndex: number;
  playerKey: 'player1' | 'player2';
  cellClasses: string;
}

export function SetCells({
  displayedSets,
  isFinished,
  isWinner,
  isLiveOrSuspended,
  currentSetIndex,
  playerKey,
  cellClasses,
}: SetCellsProps) {
  const opponentWon = !isWinner && isFinished;
  return displayedSets.map((set, i) => {
    const isCurrent = isLiveOrSuspended && i === currentSetIndex;
    const style = isCurrent
      ? 'text-telemetry-score-accent font-bold bg-telemetry-card'
      : isFinished && isWinner
        ? 'text-emerald-800 dark:text-telemetry-volt font-black bg-telemetry-card'
        : isFinished && opponentWon
          ? 'text-telemetry-text-muted/70 bg-telemetry-card font-normal'
          : 'text-telemetry-score-secondary bg-telemetry-card';
    return (
      <td key={i} className={`${cellClasses} ${style}`}>
        {renderSetScore(
          set as { player1: number; player2: number; isTiebreak?: boolean; tiebreakScore?: { player1: number; player2: number } | null } | undefined,
          playerKey
        )}
      </td>
    );
  });
}
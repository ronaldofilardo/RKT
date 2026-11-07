'use client';

import { computePlayerColor } from '@/core/scoring/match-card-color.logic';
import { ClubBadge } from './match-card-club-badge';
import { SetCells } from './match-card-set-cells';
import { LivePoints } from './match-card-live-points';

interface MatchCardRowProps {
  name: string;
  club?: string | null;
  createdBy?: string | null;
  isOwnClub?: boolean;
  isOwnAthlete?: boolean;
  isServer: boolean;
  isFinished: boolean;
  isWinner: boolean;
  displayedSets: Array<{
    player1: number;
    player2: number;
    isTiebreak?: boolean;
    tiebreakScore?: { player1: number; player2: number } | null;
  } | undefined>;
  currentSetIndex: number;
  isLiveOrSuspended: boolean;
  isCurrentSetMT: boolean;
  lastSetTiebreakScore: { player1: number; player2: number } | null;
  currentGame: { player1?: number | string; player2?: number | string; advantage?: 'player1' | 'player2' | null } | null;
  getSinglePointDisplay: (game: { player1?: number | string; player2?: number | string; advantage?: 'player1' | 'player2' | null } | undefined, player: 'player1' | 'player2') => string;
  playerKey: 'player1' | 'player2';
  cellClasses: string;
}

export function MatchCardRow({
  name,
  club,
  createdBy,
  isOwnClub,
  isOwnAthlete,
  isServer,
  isFinished,
  isWinner,
  displayedSets,
  currentSetIndex,
  isLiveOrSuspended,
  isCurrentSetMT,
  lastSetTiebreakScore,
  currentGame,
  getSinglePointDisplay,
  playerKey,
  cellClasses,
}: MatchCardRowProps) {
  const color = computePlayerColor(
    { isFinished, isWinnerP1: playerKey === 'player1' ? isWinner : false, isWinnerP2: playerKey === 'player2' ? isWinner : false, isServerP1: playerKey === 'player1' ? isServer : false, isServerP2: playerKey === 'player2' ? isServer : false },
    playerKey
  );

  return (
    <tr className="text-xs">
      <td
        title={name}
        className={`text-left py-1 px-1.5 sm:px-2 tracking-wide border border-telemetry-border/10 bg-telemetry-card ${color.textColor}`}
      >
        <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
          <span className="truncate" title={name}>{name}</span>
          <ClubBadge club={club} isOwnClub={isOwnClub} isOwnAthlete={isOwnAthlete} createdByName={createdBy} />
        </div>
      </td>
      <td className="text-center py-1 bg-telemetry-card border border-telemetry-border/10 text-xs">
        {isServer ? <span title="Sacador" aria-label="Sacador" role="img" className="text-xs select-none">🎾</span> : null}
        {isFinished && isWinner ? (
          <span title="Vencedor" aria-label="Vencedor" className="text-xs select-none filter dark:drop-shadow-[0_0_6px_rgba(204,255,0,0.7)]">
            🏆
          </span>
        ) : null}
      </td>
      <SetCells
        displayedSets={displayedSets}
        isFinished={isFinished}
        isWinner={isWinner}
        isLiveOrSuspended={isLiveOrSuspended}
        currentSetIndex={currentSetIndex}
        playerKey={playerKey}
        cellClasses={cellClasses}
      />
      {isLiveOrSuspended && (
        <LivePoints
          isCurrentSetMT={isCurrentSetMT}
          lastSetTiebreakScore={lastSetTiebreakScore}
          currentGame={currentGame}
          getSinglePointDisplay={getSinglePointDisplay}
          playerKey={playerKey}
          cellClasses={cellClasses}
        />
      )}
    </tr>
  );
}
'use client';

import { getSinglePointDisplay } from '@/components/dashboard/match-card.logic';
import { computeSetHeaderColor } from '@/core/scoring/match-card-color.logic';
import { MatchCardRow } from './match-card-row';

interface MatchCardScoreTableProps {
  displayedSets: Array<{
    player1: number;
    player2: number;
    isTiebreak?: boolean;
    tiebreakScore?: { player1: number; player2: number } | null;
  } | undefined>;
  columnTitles: string[];
  p1Name: string;
  p2Name: string;
  p1Club?: string | null;
  p2Club?: string | null;
  p1CreatedBy?: string | null;
  p2CreatedBy?: string | null;
  isP1OwnClub?: boolean;
  isP2OwnClub?: boolean;
  isP1OwnAthlete?: boolean;
  isP2OwnAthlete?: boolean;
  isWinnerP1?: boolean;
  isWinnerP2?: boolean;
  isFinished?: boolean;
  ctId?: string | null;
  isServerP1: boolean;
  isServerP2: boolean;
  isLiveOrSuspended: boolean;
  currentGame: { player1?: number | string; player2?: number | string; advantage?: 'player1' | 'player2' | null } | null;
  isCurrentSetMT: boolean;
  lastSetTiebreakScore: { player1: number; player2: number } | null;
  currentSetIndex: number;
}

export function MatchCardScoreTable({
  displayedSets,
  columnTitles,
  p1Name,
  p2Name,
  p1Club,
  p2Club,
  p1CreatedBy,
  p2CreatedBy,
  isP1OwnClub,
  isP2OwnClub,
  isP1OwnAthlete,
  isP2OwnAthlete,
  isWinnerP1,
  isWinnerP2,
  isFinished,
  ctId: _ctId,
  isServerP1,
  isServerP2,
  isLiveOrSuspended,
  currentGame,
  isCurrentSetMT,
  lastSetTiebreakScore,
  currentSetIndex,
}: MatchCardScoreTableProps) {
  const headerClasses = 'text-center px-0.5 sm:px-1 py-0.5 bg-telemetry-elevated border border-telemetry-border/10 text-[9px] sm:text-[10px] font-space-grotesk';
  const setColClasses = 'w-7 sm:w-10 md:w-11';
  const pontuacaoClasses = 'w-9 sm:w-11 md:w-12 border border-telemetry-border/10';
  const cellClasses = 'text-center px-0.5 sm:px-1 py-1 text-xs sm:text-sm font-space-grotesk font-semibold border border-telemetry-border/10';

  return (
    <div className="px-3 sm:px-4 pb-3">
      <div className="rounded-md overflow-x-auto border border-telemetry-border/10 scrollbar-thin">
        <table className="w-full min-w-[270px] sm:min-w-full table-fixed border-collapse border-0">
          <thead>
            <tr className="text-[9px] sm:text-[10px] font-space-grotesk">
              <th scope="col" aria-label="Jogador" className="text-left py-0.5 px-1.5 sm:px-2 bg-telemetry-elevated border border-telemetry-border/10"></th>
              <th scope="col" aria-label="Vencedor" className="w-5 sm:w-6 bg-telemetry-elevated border border-telemetry-border/10"></th>
              {columnTitles.map((title, i) => {
                const isCurrentHeader = isLiveOrSuspended && i === currentSetIndex;
                return (
                  <th
                    key={i}
                    scope="col"
                    aria-label={title}
                    className={`${headerClasses} ${setColClasses} ${computeSetHeaderColor(isCurrentHeader)}`}
                  >
                    {title}
                  </th>
                );
              })}
              {isLiveOrSuspended && (
                <th scope="col" aria-label="Pontos" className={`${headerClasses} ${pontuacaoClasses} font-bold text-telemetry-score-accent`}>
                  Pontos
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            <MatchCardRow
              name={p1Name}
              club={p1Club}
              createdBy={p1CreatedBy}
              isOwnClub={isP1OwnClub}
              isOwnAthlete={isP1OwnAthlete}
              isServer={isServerP1}
              isFinished={isFinished ?? false}
              isWinner={isWinnerP1 ?? false}
              displayedSets={displayedSets}
              currentSetIndex={currentSetIndex}
              isLiveOrSuspended={isLiveOrSuspended}
              isCurrentSetMT={isCurrentSetMT}
              lastSetTiebreakScore={lastSetTiebreakScore}
              currentGame={currentGame}
              getSinglePointDisplay={getSinglePointDisplay}
              playerKey="player1"
              cellClasses={cellClasses}
            />
            <MatchCardRow
              name={p2Name}
              club={p2Club}
              createdBy={p2CreatedBy}
              isOwnClub={isP2OwnClub}
              isOwnAthlete={isP2OwnAthlete}
              isServer={isServerP2}
              isFinished={isFinished ?? false}
              isWinner={isWinnerP2 ?? false}
              displayedSets={displayedSets}
              currentSetIndex={currentSetIndex}
              isLiveOrSuspended={isLiveOrSuspended}
              isCurrentSetMT={isCurrentSetMT}
              lastSetTiebreakScore={lastSetTiebreakScore}
              currentGame={currentGame}
              getSinglePointDisplay={getSinglePointDisplay}
              playerKey="player2"
              cellClasses={cellClasses}
            />
          </tbody>
        </table>
      </div>
    </div>
  );
}
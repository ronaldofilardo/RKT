'use client';

import { getSinglePointDisplay } from '@/components/dashboard/match-card.logic';
import { computeSetHeaderColor } from '@/core/scoring/match-card-color.logic';
import { MatchCardRow } from './match-card-row';
import type { MatchCardScoreTableProps } from './match-card-score-grid.types';

export function MatchCardScoreTable({
  displayedSets, columnTitles, p1Name, p2Name, p1Club, p2Club, p1CreatedBy, p2CreatedBy,
  p1CreatorBadge, p2CreatorBadge, isP1OwnClub, isP2OwnClub, isP1OwnAthlete, isP2OwnAthlete,
  isWinnerP1, isWinnerP2, isFinished, isServerP1, isServerP2, isLiveOrSuspended,
  currentGame, isCurrentSetMT, lastSetTiebreakScore, currentSetIndex,
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
              <th scope="col" aria-label="Jogador" className="text-left py-0.5 px-1.5 sm:px-2 bg-telemetry-elevated border border-telemetry-border/10" />
              <th scope="col" aria-label="Vencedor" className="w-5 sm:w-6 bg-telemetry-elevated border border-telemetry-border/10" />
              {columnTitles.map((title, i) => {
                const isCurrentHeader = isLiveOrSuspended && i === currentSetIndex;
                return (
                  <th key={i} scope="col" aria-label={title} className={`${headerClasses} ${setColClasses} ${computeSetHeaderColor(isCurrentHeader)}`}>
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
              name={p1Name} club={p1Club} createdBy={p1CreatedBy} creatorBadge={p1CreatorBadge}
              isOwnClub={isP1OwnClub} isOwnAthlete={isP1OwnAthlete} isServer={isServerP1}
              isFinished={isFinished ?? false} isWinner={isWinnerP1 ?? false}
              displayedSets={displayedSets} currentSetIndex={currentSetIndex}
              isLiveOrSuspended={isLiveOrSuspended} isCurrentSetMT={isCurrentSetMT}
              lastSetTiebreakScore={lastSetTiebreakScore} currentGame={currentGame}
              getSinglePointDisplay={getSinglePointDisplay} playerKey="player1" cellClasses={cellClasses}
            />
            <MatchCardRow
              name={p2Name} club={p2Club} createdBy={p2CreatedBy} creatorBadge={p2CreatorBadge}
              isOwnClub={isP2OwnClub} isOwnAthlete={isP2OwnAthlete} isServer={isServerP2}
              isFinished={isFinished ?? false} isWinner={isWinnerP2 ?? false}
              displayedSets={displayedSets} currentSetIndex={currentSetIndex}
              isLiveOrSuspended={isLiveOrSuspended} isCurrentSetMT={isCurrentSetMT}
              lastSetTiebreakScore={lastSetTiebreakScore} currentGame={currentGame}
              getSinglePointDisplay={getSinglePointDisplay} playerKey="player2" cellClasses={cellClasses}
            />
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { Fragment } from 'react';
import type { TimelinePoint } from '@/core/scoring/types';
import { getGameEndInfo } from './timeline-utils';
import { GameEndRow } from './timeline-game-end-row';
import { PointRow } from './timeline-point-row';

// Re-exports de compatibilidade (módulo movido para ./timeline-point-row).
export { PointRow } from './timeline-point-row';
// Re-exports de compatibilidade (helpers movidos para ./timeline-row-utils).
export { getPlayerInitials } from './timeline-row-utils';

interface SetGroupProps {
  setNumber: number;
  points: TimelinePoint[];
  allPoints: TimelinePoint[];
  hasActiveFilters: boolean;
  isLast: boolean;
  matchId: string;
  player1Name: string;
  player2Name: string;
}

export function SetGroup({ setNumber: _setNumber, points, hasActiveFilters, isLast, matchId, player1Name, player2Name }: SetGroupProps) {
  return (
    <>
      {!hasActiveFilters && (
        <tr>
          <td
            colSpan={25}
            aria-label={`Set ${_setNumber}`}
            className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-telemetry-text-primary bg-telemetry-elevated border-y border-white/10"
          >
            <div className="flex items-center gap-2">
              <span>Set {_setNumber}</span>
            </div>
          </td>
        </tr>
      )}
      {points.map((p, i) => {
        const prevPoint = i > 0 ? points[i - 1] : null;
        const nextPoint = i < points.length - 1 ? points[i + 1] : null;
        const hasGap = !hasActiveFilters && prevPoint && p.pointNumber - prevPoint.pointNumber > 1;
        // gamesScore muda → novo game. Também usamos o gameScore como
        // fallback (quando gamesScore é igual mas gameScore zerou, ex.:
        // tiebreak).
        const isFirstPointOfGame =
          i === 0 ||
          prevPoint!.gamesScore.player1 !== p.gamesScore.player1 ||
          prevPoint!.gamesScore.player2 !== p.gamesScore.player2 ||
          (prevPoint!.gameScore.player1 === 0 && prevPoint!.gameScore.player2 === 0);

        const isLastPointOfSet = i === points.length - 1;
        const gameEnd = !hasActiveFilters ? getGameEndInfo(p, nextPoint, isLastPointOfSet) : null;
        const winnerName = gameEnd?.winner === 'PLAYER_1' ? player1Name : player2Name;

        return (
          <Fragment key={`${p.setNumber}-${p.pointNumber}`}>
            <PointRow
              point={p}
              hasGap={!!hasGap}
              isLast={isLast && isLastPointOfSet}
              matchId={matchId}
              isFirstPointOfGame={isFirstPointOfGame}
              player1Name={player1Name}
              player2Name={player2Name}
            />
            {gameEnd && (
              <GameEndRow
                point={p}
                winnerName={winnerName}
                gameFinalScore={gameEnd.gameFinalScore}
                isBreak={gameEnd.isBreak}
              />
            )}
          </Fragment>
        );
      })}
    </>
  );
}

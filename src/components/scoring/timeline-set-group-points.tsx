import { Fragment } from 'react';
import type { TimelinePoint } from '@/core/scoring/types';
import { getGameEndInfo } from './timeline.logic';
import { GameEndRow } from './timeline-game-end-row';
import { PointRow } from './timeline-point-row';
import type { TimelineDoublesConfig } from './timeline-row.logic';
import { TiebreakBannerRow } from './timeline-set-group-banner';

interface SetGroupPointsProps {
  points: TimelinePoint[];
  hasActiveFilters: boolean;
  isMatchTb?: boolean;
  isLast: boolean;
  matchId: string;
  player1Name: string;
  player2Name: string;
  doubles?: TimelineDoublesConfig;
  initialGames?: number;
  colSpan: number;
}

export function SetGroupPoints({
  points,
  hasActiveFilters,
  isMatchTb,
  isLast,
  matchId,
  player1Name,
  player2Name,
  doubles,
  initialGames = 0,
  colSpan,
}: SetGroupPointsProps) {
  return (
    <>
      {points.map((p, i) => {
        const prevPoint = i > 0 ? points[i - 1] : null;
        const nextPoint = i < points.length - 1 ? points[i + 1] : null;
        const hasGap = !hasActiveFilters && prevPoint && p.pointNumber - prevPoint.pointNumber > 1;

        // gamesScore muda → novo game (fallback: gameScore zerou, ex.: tiebreak).
        const isFirstPointOfGame =
          i === 0 ||
          prevPoint!.gamesScore.player1 !== p.gamesScore.player1 ||
          prevPoint!.gamesScore.player2 !== p.gamesScore.player2 ||
          (prevPoint!.gameScore.player1 === 0 && prevPoint!.gameScore.player2 === 0);

        const isLastPointOfSet = i === points.length - 1;
        // Em Match Tiebreak decisivo não há "fim de game" entre pontos.
        const gameEnd = (!hasActiveFilters && !isMatchTb)
          ? getGameEndInfo(p, nextPoint, isLastPointOfSet)
          : null;

        const winnerName = gameEnd?.winner === 'PLAYER_1'
          ? (doubles?.player1PartnerName ? `${player1Name} / ${doubles.player1PartnerName}` : player1Name)
          : (doubles?.player2PartnerName ? `${player2Name} / ${doubles.player2PartnerName}` : player2Name);

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
              doubles={doubles}
              isMatchTb={isMatchTb}
              initialGames={initialGames}
            />
            {gameEnd && (
              <>
                <GameEndRow
                  point={p}
                  winnerName={winnerName}
                  winnerSide={gameEnd.winner}
                  gameFinalScore={gameEnd.gameFinalScore}
                  isBreak={gameEnd.isBreak}
                  tiebreakStart={gameEnd.isTiebreakEntry}
                />
                {/* Banner de Tie-break de set regular (ex: 6x6 ou 9x9 no PRO_SET_8). */}
                {gameEnd.isTiebreakEntry && !hasActiveFilters && (
                  <TiebreakBannerRow
                    colSpan={colSpan}
                    label="Tie-break"
                    sublabel={`${gameEnd.gameFinalScore.player1}x${gameEnd.gameFinalScore.player2} games`}
                  />
                )}
              </>
            )}
          </Fragment>
        );
      })}
    </>
  );
}

'use client';

import { getSinglePointDisplay } from './match-card.logic';
import { MatchCardScoreCell } from './match-card-player-row';
import {
  BORDER_LEFT,
  MatchCardScoreTable,
  MatchCardSetsCells,
  type MatchCardScoreDerived,
} from './match-card-score-table';

interface MatchCardScoreProps {
  playerName1: string;
  playerName2: string;
  isServerP1: boolean;
  isServerP2: boolean;
  barBg: string;
  scoreBg: string;
  hasScore: boolean;
  format: string;
}

export function MatchCardScore({
  playerName1,
  playerName2,
  isServerP1,
  isServerP2,
  barBg,
  scoreBg,
  hasScore,
  format,
  displayedSets,
  currentGame,
  isFinished,
  isCurrentSetMT,
  lastSetTiebreakScore,
}: MatchCardScoreProps & MatchCardScoreDerived) {
  const rows = {
    p1: { name: playerName1, isServer: isServerP1 },
    p2: { name: playerName2, isServer: isServerP2 },
  };

  if (hasScore && displayedSets.length > 0) {
    return (
      <MatchCardScoreTable
        barBg={barBg}
        p1={rows.p1}
        p2={rows.p2}
        renderCells={(playerKey) => (
          <MatchCardSetsCells
            playerKey={playerKey}
            scoreBg={scoreBg}
            format={format}
            displayedSets={displayedSets}
            currentGame={currentGame}
            isFinished={isFinished}
            isCurrentSetMT={isCurrentSetMT}
            lastSetTiebreakScore={lastSetTiebreakScore}
          />
        )}
      />
    );
  }

  if (hasScore && currentGame) {
    return (
      <MatchCardScoreTable
        barBg={barBg}
        p1={rows.p1}
        p2={rows.p2}
        renderCells={(playerKey) => (
          <MatchCardScoreCell bg={scoreBg} borderLeft={BORDER_LEFT}>
            {getSinglePointDisplay(currentGame ?? undefined, playerKey)}
          </MatchCardScoreCell>
        )}
      />
    );
  }

  return <MatchCardScoreTable barBg={barBg} p1={rows.p1} p2={rows.p2} renderCells={() => null} />;
}

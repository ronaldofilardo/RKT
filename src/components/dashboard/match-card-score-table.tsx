'use client';

import type { ReactNode } from 'react';
import { formatCompactSetScore, getSinglePointDisplay, isSetIndexMatchTiebreak, type NormalizedScoreState, type SetCellScore, type TennisFormat } from './match-card.logic';
import { MatchCardPlayerRow, MatchCardScoreCell, MatchCardSeparator } from './match-card-player-row';

export const BORDER_LEFT = '2px solid rgb(var(--telemetry-card))';
const TABLE_WRAPPER = { display: 'table', width: '100%', borderCollapse: 'collapse' } as const;

/** Derivados compartilhados pelos modos de renderização do placar. */
export interface MatchCardScoreDerived {
  displayedSets: SetCellScore[];
  currentGame: NormalizedScoreState['currentGame'] | null;
  isFinished: boolean;
  isCurrentSetMT: boolean;
  lastSetTiebreakScore: { player1: number; player2: number } | null;
}

interface PlayerRowSpec {
  name: string;
  isServer: boolean;
}

/** Tabela de 2 linhas (P1 / separador / P2); `renderCells` devolve as células de placar. */
export function MatchCardScoreTable({
  barBg,
  p1,
  p2,
  renderCells,
}: {
  barBg: string;
  p1: PlayerRowSpec;
  p2: PlayerRowSpec;
  renderCells: (playerKey: 'player1' | 'player2') => ReactNode;
}) {
  const row = (spec: PlayerRowSpec, testId: string, playerKey: 'player1' | 'player2') => (
    <MatchCardPlayerRow
      name={spec.name}
      isServer={spec.isServer}
      serverTestId={testId}
      barBg={barBg}
    >
      {renderCells(playerKey)}
    </MatchCardPlayerRow>
  );
  return (
    <div className="px-4 pb-3" style={TABLE_WRAPPER}>
      {row(p1, 'server-indicator-player1', 'player1')}
      <MatchCardSeparator />
      {row(p2, 'server-indicator-player2', 'player2')}
    </div>
  );
}

/** Células de games + pontos de um jogador, no modo "sets completos". */
export function MatchCardSetsCells({
  playerKey,
  scoreBg,
  format,
  displayedSets,
  currentGame,
  isFinished,
  isCurrentSetMT,
  lastSetTiebreakScore,
}: {
  playerKey: 'player1' | 'player2';
  scoreBg: string;
  format: string;
} & MatchCardScoreDerived) {
  const numSets = displayedSets.length;
  return (
    <div style={{ display: 'table-cell', borderLeft: BORDER_LEFT }}>
      <div className="flex items-stretch">
        {displayedSets.map((s, idx) => (
          <MatchCardScoreCell
            key={idx}
            bg={scoreBg}
            borderRight={idx < numSets - 1 ? '1px solid rgb(var(--telemetry-card))' : 'none'}
          >
            {formatCompactSetScore(s, playerKey, isSetIndexMatchTiebreak(displayedSets, idx, format as TennisFormat))}
          </MatchCardScoreCell>
        ))}
        {!isFinished && (
          <MatchCardScoreCell bg={scoreBg}>
            {isCurrentSetMT
              ? '-'
              : lastSetTiebreakScore
                ? lastSetTiebreakScore[playerKey]
                : getSinglePointDisplay(currentGame ?? undefined, playerKey)}
          </MatchCardScoreCell>
        )}
      </div>
    </div>
  );
}

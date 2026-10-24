import type { ScoringState } from './types';
import { isBreakPoint, isGameBall, isSetBall } from './point-ball-context.logic';

export interface PointSnapshot {
  setNumber: number;
  isTiebreak: boolean;
  server: 'player1' | 'player2';
  gamesScore: { player1: number; player2: number };
  gameScore: { player1: number; player2: number };
  isBreakPoint: boolean;
  isGameBall: boolean;
  isSetBall: boolean;
  gameIsDeuce: boolean;
  gameAdvantage: 'player1' | 'player2' | null;
}

/**
 * Deriva o contexto de placar de um ponto a partir do estado do engine
 * naquele instante. Função pura extraída de `enrichPointsFromHistory` para
 * reduzir a complexidade ciclomática da reconstrução da timeline.
 */
export function derivePointSnapshot(stateBefore: ScoringState | null): PointSnapshot {
  const sets = Array.isArray(stateBefore?.sets) ? stateBefore.sets : [];
  const setsWon = stateBefore?.setsWon
    ? (stateBefore.setsWon.player1 ?? 0) + (stateBefore.setsWon.player2 ?? 0)
    : 0;
  const isNextSetPending = sets.length > 0 && setsWon >= sets.length;

  const setNumber = isNextSetPending
    ? sets.length + 1
    : sets.length > 0
      ? sets.length
      : 1;

  const currentSet = !isNextSetPending && sets.length > 0 ? sets[sets.length - 1] : undefined;
  const isTiebreak = currentSet?.isTiebreak ?? false;
  const tiebreakScore = isTiebreak ? currentSet?.tiebreakScore : null;

  // Em tiebreak o placar exibido é o próprio placar do tiebreak.
  const scoreOrTiebreak = (fallback: { player1: number; player2: number }) =>
    tiebreakScore
      ? { player1: tiebreakScore.player1, player2: tiebreakScore.player2 }
      : fallback;

  const gamesScore = scoreOrTiebreak({
    player1: currentSet?.player1 ?? 0,
    player2: currentSet?.player2 ?? 0,
  });

  const currentGame = stateBefore?.currentGame ?? {
    player1: 0,
    player2: 0,
    isDeuce: false,
    advantage: null,
  };
  const gameScore = scoreOrTiebreak({
    player1: currentGame.player1,
    player2: currentGame.player2,
  });

  return {
    setNumber,
    isTiebreak,
    server: stateBefore?.server ?? 'player1',
    gamesScore,
    gameScore,
    isBreakPoint: stateBefore ? isBreakPoint(stateBefore) : false,
    isGameBall: stateBefore ? isGameBall(stateBefore) : false,
    isSetBall: stateBefore ? isSetBall(stateBefore, setNumber) : false,
    gameIsDeuce: currentGame.isDeuce ?? false,
    gameAdvantage: currentGame.advantage ?? null,
  };
}

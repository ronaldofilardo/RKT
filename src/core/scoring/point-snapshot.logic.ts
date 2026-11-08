import type { ScoringState, TennisFormat } from './types';
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
 *
 * IMPORTANTE — separação de responsabilidades dos dois campos de placar:
 *
 *   gamesScore — placar de GAMES do set (ex: 6x6 num tiebreak regular ou
 *                9x9 no PRO_SET_8). Nunca substituído pelo tiebreakScore,
 *                pois a coluna GAMES da timeline deve sempre exibir os games
 *                reais, mesmo durante o tiebreak.
 *
 *   gameScore  — pontos do game ou, quando em tiebreak, pontos do próprio
 *                tiebreak (tiebreakScore). É este campo que alimenta a
 *                coluna PONTOS e getGameScoreLabelForPoint.
 */
export function derivePointSnapshot(stateBefore: ScoringState | null, format?: TennisFormat): PointSnapshot {
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

  // Bug 1 — gamesScore reflete SEMPRE o placar de games do set, nunca o
  // tiebreakScore. Isso garante que a coluna GAMES da timeline exiba 9x9
  // (PRO_SET_8) ou 6x6 (tiebreak regular) em vez dos pontos do tiebreak.
  const gamesScore = {
    player1: currentSet?.player1 ?? 0,
    player2: currentSet?.player2 ?? 0,
  };

  const currentGame = stateBefore?.currentGame ?? {
    player1: 0,
    player2: 0,
    isDeuce: false,
    advantage: null,
  };

  // gameScore: durante tiebreak usa os pontos do tiebreak (alimenta coluna PONTOS).
  // Fora do tiebreak usa os pontos do game atual.
  const gameScore = tiebreakScore
    ? { player1: tiebreakScore.player1, player2: tiebreakScore.player2 }
    : { player1: currentGame.player1, player2: currentGame.player2 };

  return {
    setNumber,
    isTiebreak,
    server: stateBefore?.server ?? 'player1',
    gamesScore,
    gameScore,
    isBreakPoint: stateBefore ? isBreakPoint(stateBefore, format) : false,
    isGameBall: stateBefore ? isGameBall(stateBefore, format) : false,
    // Bug 4 — passa format para que isSetBall respeite PRO_SET_8 (limiar 7, não 5).
    isSetBall: stateBefore ? isSetBall(stateBefore, setNumber, format) : false,
    gameIsDeuce: currentGame.isDeuce ?? false,
    gameAdvantage: currentGame.advantage ?? null,
  };
}

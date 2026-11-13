import type { ScoringState, TennisFormat } from './types';
import { isPointDecisiveDeuce } from './ball-context-players.logic';

// Predicados por jogador (game ball/set ball por jogador) moram em ./ball-context-players.logic
// e são re-exportados aqui para preservar a API pública deste módulo.
export { isPointDecisiveDeuce, isGamePointForPlayer, isSetPointForPlayer } from './ball-context-players.logic';

export function isBreakPoint(state: ScoringState, format?: TennisFormat): boolean {
  if (!state || state.isFinished) return false;
  const set = state.sets?.[state.sets.length - 1];
  if (set?.isTiebreak) return false;
  const game = state.currentGame ?? { player1: 0, player2: 0, isDeuce: false, advantage: null };
  const receiver = state.server === 'player1' ? 'player2' : 'player1';
  if (isPointDecisiveDeuce(game, format)) return true;
  if (game.isDeuce) return game.advantage === receiver;
  const receiverPoints = receiver === 'player1' ? game.player1 : game.player2;
  const serverPoints = receiver === 'player1' ? game.player2 : game.player1;
  return receiverPoints >= 3 && serverPoints <= 2;
}

export function isGameBall(state: ScoringState, format?: TennisFormat): boolean {
  if (!state) return false;
  const game = state.currentGame ?? { player1: 0, player2: 0, isDeuce: false, advantage: null };
  const set = state.sets?.[state.sets.length - 1];
  if (set?.isTiebreak && set.tiebreakScore) {
    const p1 = set.tiebreakScore.player1;
    const p2 = set.tiebreakScore.player2;
    return (p1 >= 6 && p1 - p2 >= 1) || (p2 >= 6 && p2 - p1 >= 1);
  }
  if (isPointDecisiveDeuce(game, format)) return true;
  if (game.isDeuce) return Boolean(game.advantage);
  return (game.player1 >= 3 && game.player2 <= 2) || (game.player2 >= 3 && game.player1 <= 2);
}

/**
 * Bug 4 — isSetBall precisa respeitar o limiar do formato.
 * PRO_SET_8: set encerra em 8 games → set ball a partir de 7 (com adversário ≤ 6).
 * Demais formatos: 6 games → set ball a partir de 5 (com adversário ≤ 4).
 */
export function isSetBall(state: ScoringState, setNumber: number, format?: TennisFormat): boolean {
  if (!state) return false;
  const set = state.sets?.[setNumber - 1];
  if (!set) return false;
  const target = format === 'PRO_SET_8' ? 8 : 6;
  const threshold = target - 1; // 7 para PRO_SET_8, 5 para os demais
  const margin = target - 2;    // 6 para PRO_SET_8, 4 para os demais
  return (set.player1 >= threshold && set.player2 <= margin) ||
         (set.player2 >= threshold && set.player1 <= margin);
}

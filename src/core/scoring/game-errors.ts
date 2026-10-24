import type { TimelinePoint } from './types';
import { computeCompletedGames } from '../report/serve-return-stats';
import { classifyPointError, type GameErrorEntry } from './game-error-classify.logic';

export type { GameErrorEntry } from './game-error-classify.logic';
export { classifyPointError } from './game-error-classify.logic';

/**
 * Agrega os erros (não forçados e forçados) de cada jogador game a game,
 * usando os limites de game calculados a partir da timeline.
 */
export function computeGameErrors(points: TimelinePoint[]): GameErrorEntry[] {
  if (points.length === 0) return [];

  const completedGames = computeCompletedGames(points);
  const result: GameErrorEntry[] = [];

  for (let gIdx = 0; gIdx < completedGames.length; gIdx++) {
    const g = completedGames[gIdx];
    const gamePoints = points.slice(g.startIdx, g.endIdx + 1);
    if (gamePoints.length === 0) continue;

    const lastPoint = gamePoints[gamePoints.length - 1];
    let p1Unforced = 0;
    let p1Forced = 0;
    let p2Unforced = 0;
    let p2Forced = 0;

    for (const p of gamePoints) {
      // O ofensor é o perdedor do ponto: se P1 venceu, P2 errou, e vice-versa.
      const offenderServer: 'player1' | 'player2' =
        p.winner === 'PLAYER_1' ? 'player2' : 'player1';
      const kind = classifyPointError(p, offenderServer);
      if (kind === 'unforced') {
        if (offenderServer === 'player1') p1Unforced++;
        else p2Unforced++;
      } else if (kind === 'forced') {
        if (offenderServer === 'player1') p1Forced++;
        else p2Forced++;
      }
    }

    const winner: 'player1' | 'player2' = g.winner === 'PLAYER_1' ? 'player1' : 'player2';
    const beforeP1 = lastPoint.gamesScore.player1;
    const beforeP2 = lastPoint.gamesScore.player2;
    const afterP1 = winner === 'player1' ? beforeP1 + 1 : beforeP1;
    const afterP2 = winner === 'player2' ? beforeP2 + 1 : beforeP2;
    const scoreLabel = `${afterP1}-${afterP2}`;

    result.push({
      gameIndex: gIdx + 1,
      server: g.server,
      scoreLabel,
      isTiebreak: g.isTiebreak,
      winner,
      p1Errors: {
        unforced: p1Unforced,
        forced: p1Forced,
        total: p1Unforced + p1Forced,
      },
      p2Errors: {
        unforced: p2Unforced,
        forced: p2Forced,
        total: p2Unforced + p2Forced,
      },
    });
  }

  return result;
}

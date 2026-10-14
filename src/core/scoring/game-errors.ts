import type { TimelinePoint } from './types';
import { computeCompletedGames } from '../report/serve-return-stats';

export interface GameErrorEntry {
  gameIndex: number; // 1-based (Game 1, Game 2, ...)
  server: 'player1' | 'player2';
  scoreLabel: string; // Ex: "1-0", "1-1"
  isTiebreak: boolean;
  winner: 'player1' | 'player2';
  p1Errors: {
    unforced: number;
    forced: number;
    total: number;
  };
  p2Errors: {
    unforced: number;
    forced: number;
    total: number;
  };
}

/**
 * Classifica o erro cometido num ponto. `offenderServer` é o lado do jogador
 * que PERDEU o ponto (ou seja, cometeu o erro). Dupla falta conta como erro
 * não forçado apenas quando o sacador é o ofensor.
 */
export function classifyPointError(
  p: TimelinePoint,
  offenderServer: 'player1' | 'player2',
): 'unforced' | 'forced' | null {
  const tipo = p.rallyDetails?.tipo;
  if (
    tipo === 'erro_nao_forcado' ||
    p.type === 'UNFORCED_ERROR' ||
    (p.type === 'DOUBLE_FAULT' && p.server === offenderServer)
  ) {
    return 'unforced';
  }
  if (tipo === 'erro_forcado' || p.type === 'FORCED_ERROR') {
    return 'forced';
  }
  return null;
}

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

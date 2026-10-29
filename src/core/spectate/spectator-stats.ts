import type { SpectatorPoint } from './types';

export interface SpectatorSideStats {
  points: number;
  aces: number;
  doubleFaults: number;
  winners: number;
  forcedErrors: number;
  unforcedErrors: number;
  breakPointsWon: number;
  breakPointsTotal: number;
}

const empty = (): SpectatorSideStats => ({
  points: 0,
  aces: 0,
  doubleFaults: 0,
  winners: 0,
  forcedErrors: 0,
  unforcedErrors: 0,
  breakPointsWon: 0,
  breakPointsTotal: 0,
});

/**
 * Estatísticas derivadas só dos pontos públicos.
 * Erros e duplas faltas são atribuídos a quem PERDEU o ponto.
 * Break point pertence a quem está devolvendo (lado oposto ao sacador).
 */
export function computeSpectatorStats(points: SpectatorPoint[]): { side1: SpectatorSideStats; side2: SpectatorSideStats } {
  const stats = { side1: empty(), side2: empty() };

  for (const p of points) {
    const winner = p.winnerSide;
    const loser = winner === 'side1' ? 'side2' : 'side1';
    stats[winner].points += 1;

    if (p.type === 'ACE') stats[winner].aces += 1;
    if (p.type === 'WINNER') stats[winner].winners += 1;
    if (p.type === 'DOUBLE_FAULT') stats[loser].doubleFaults += 1;
    if (p.type === 'FORCED_ERROR') stats[loser].forcedErrors += 1;
    if (p.type === 'UNFORCED_ERROR') stats[loser].unforcedErrors += 1;

    if (p.isBreakPoint && p.serverSide) {
      const returner = p.serverSide === 'side1' ? 'side2' : 'side1';
      stats[returner].breakPointsTotal += 1;
      if (winner === returner) stats[returner].breakPointsWon += 1;
    }
  }
  return stats;
}

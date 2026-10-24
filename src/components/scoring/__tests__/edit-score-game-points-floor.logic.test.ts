import { computeGamePointsMinProgress } from '../edit-score-game-points-floor.logic';

describe('computeGamePointsMinProgress', () => {
  it('deve retornar 0 para ambos se floorCurrentSets for null', () => {
    const result = computeGamePointsMinProgress({
      p1Val: 0,
      p2Val: 1,
      floorCurrentSets: null,
      currentGamePoints: { player1: 0, player2: 15 },
    });
    expect(result).toEqual({ minP1: 0, minP2: 0 });
  });

  it('deve retornar 0 para ambos se currentGamePoints for null', () => {
    const result = computeGamePointsMinProgress({
      p1Val: 0,
      p2Val: 1,
      floorCurrentSets: { player1: 0, player2: 1 },
      currentGamePoints: null,
    });
    expect(result).toEqual({ minP1: 0, minP2: 0 });
  });

  it('deve manter o piso de pontos quando o placar de games for igual ao ponto de parada (0x1 com 0-15)', () => {
    const result = computeGamePointsMinProgress({
      p1Val: 0,
      p2Val: 1,
      floorCurrentSets: { player1: 0, player2: 1 },
      currentGamePoints: { player1: '0', player2: '15' },
    });
    // P1=0 (índice 0), P2=15 (índice 1)
    expect(result).toEqual({ minP1: 0, minP2: 1 });
  });

  it('deve liberar pontos a partir de 0-0 ao aumentar o set de 0x1 para 1x1', () => {
    const result = computeGamePointsMinProgress({
      p1Val: 1,
      p2Val: 1,
      floorCurrentSets: { player1: 0, player2: 1 },
      currentGamePoints: { player1: '0', player2: '15' },
    });
    // Como os games mudaram, novo game começa em 0-0
    expect(result).toEqual({ minP1: 0, minP2: 0 });
  });

  it('deve liberar pontos a partir de 0-0 ao aumentar o set de 0x1 para 0x2', () => {
    const result = computeGamePointsMinProgress({
      p1Val: 0,
      p2Val: 2,
      floorCurrentSets: { player1: 0, player2: 1 },
      currentGamePoints: { player1: '0', player2: '15' },
    });
    expect(result).toEqual({ minP1: 0, minP2: 0 });
  });

  it('deve respeitar piso avançado (30x40 no mesmo game 2x2)', () => {
    const result = computeGamePointsMinProgress({
      p1Val: 2,
      p2Val: 2,
      floorCurrentSets: { player1: 2, player2: 2 },
      currentGamePoints: { player1: '30', player2: '40' },
    });
    // P1=30 (índice 2), P2=40 (índice 3)
    expect(result).toEqual({ minP1: 2, minP2: 3 });
  });
});

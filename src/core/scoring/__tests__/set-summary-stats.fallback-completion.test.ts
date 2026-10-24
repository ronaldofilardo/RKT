import { computeSetSummary } from '../set-summary-stats';

describe('computeSetSummary — fallbackScore.isCompleted', () => {
  it('set em andamento (isCompleted=false) não é concluído e não tem vencedor, mesmo com placar desigual', () => {
    const summary = computeSetSummary([], 1, { player1: 4, player2: 3, isCompleted: false });

    expect(summary.score).toEqual({ player1: 4, player2: 3, tiebreakScore: undefined });
    expect(summary.isCompleted).toBe(false);
    expect(summary.winner).toBeNull();
  });

  it('set concluído (isCompleted=true) usa o placar do fallback e define o vencedor', () => {
    const summary = computeSetSummary([], 2, { player1: 6, player2: 2, isCompleted: true });

    expect(summary.score.player1).toBe(6);
    expect(summary.score.player2).toBe(2);
    expect(summary.isCompleted).toBe(true);
    expect(summary.winner).toBe('player1');
  });

  it('sem isCompleted mantém o comportamento legado (vencedor pelo placar)', () => {
    const summary = computeSetSummary([], 1, { player1: 3, player2: 6 });

    expect(summary.isCompleted).toBe(true);
    expect(summary.winner).toBe('player2');
  });

  it('desempate decide o vencedor quando os games empatam', () => {
    const summary = computeSetSummary([], 1, {
      player1: 6,
      player2: 6,
      isCompleted: true,
      tiebreakScore: { player1: 5, player2: 7 },
    });

    expect(summary.winner).toBe('player2');
  });
});

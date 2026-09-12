import { buildNewScoringState } from '../useSessionManager.state-builder';

describe('useSessionManager.state-builder - Regressoes Reais', () => {
  it('deve construir estado finalizado quando sets atingem setsToWin em BEST_OF_3', () => {
    const setResults = [
      { p1Games: 6, p2Games: 4, isPartial: false },
      { p1Games: 6, p2Games: 3, isPartial: false },
    ];

    const state = buildNewScoringState({
      setResults,
      server: 'player1',
      format: 'BEST_OF_3',
    });

    expect(state.isFinished).toBe(true);
    expect(state.winner).toBe('player1');
    expect(state.setsWon).toEqual({ player1: 2, player2: 0 });
    expect(state.sets.length).toBe(2);
    expect(state.sets[0].player1).toBe(6);
    expect(state.sets[0].player2).toBe(4);
  });

  it('deve construir estado em andamento com partialSet para set atual', () => {
    const setResults = [
      { p1Games: 6, p2Games: 4, isPartial: false },
    ];
    const partialSet = { p1Games: 3, p2Games: 2, isPartial: true };

    const state = buildNewScoringState({
      setResults,
      server: 'player2',
      format: 'BEST_OF_3',
      partialSet,
    });

    expect(state.isFinished).toBe(false);
    expect(state.winner).toBeNull();
    expect(state.setsWon).toEqual({ player1: 1, player2: 0 });
    expect(state.server).toBe('player2');
  });
});

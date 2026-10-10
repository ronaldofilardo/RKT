import { buildNewScoringState } from '../useSessionManager.state-builder';

describe('buildNewScoringState — SHORT_SET_2V2_NO_AD (Sets Curtos 2/2)', () => {
  it('após o set 1 finalizado (6-3) o set seguinte entra em 2-2 (e não 0-0)', () => {
    const state = buildNewScoringState({
      setResults: [{ p1Games: 6, p2Games: 3, isPartial: false }],
      server: 'player1',
      format: 'SHORT_SET_2V2_NO_AD',
    });

    expect(state.setsWon).toEqual({ player1: 1, player2: 0 });
    expect(state.isFinished).toBe(false);
    expect(state.sets).toHaveLength(2);
    expect(state.sets[1]).toEqual({ player1: 2, player2: 2, isTiebreak: false, tiebreakScore: null });
  });

  it('com 1x1 após 2 sets finalizados o próximo set é o Match Tiebreak', () => {
    const state = buildNewScoringState({
      setResults: [
        { p1Games: 6, p2Games: 3, isPartial: false },
        { p1Games: 3, p2Games: 6, isPartial: false },
      ],
      server: 'player1',
      format: 'SHORT_SET_2V2_NO_AD',
    });

    expect(state.setsWon).toEqual({ player1: 1, player2: 1 });
    expect(state.sets).toHaveLength(3);
    expect(state.sets[2]).toMatchObject({
      player1: 0,
      player2: 0,
      isTiebreak: true,
      tiebreakScore: { player1: 0, player2: 0 },
    });
  });

  it('4-2 não conta como set concluído (regra de 4 games removida)', () => {
    const state = buildNewScoringState({
      setResults: [{ p1Games: 4, p2Games: 2, isPartial: true }],
      server: 'player1',
      format: 'SHORT_SET_2V2_NO_AD',
    });

    expect(state.setsWon).toEqual({ player1: 0, player2: 0 });
    expect(state.sets).toHaveLength(1);
  });

  it('formatos em 0-0 continuam empilhando o set vazio 0-0', () => {
    const state = buildNewScoringState({
      setResults: [{ p1Games: 6, p2Games: 3, isPartial: false }],
      server: 'player1',
      format: 'BEST_OF_3',
    });

    expect(state.sets).toHaveLength(2);
    expect(state.sets[1]).toEqual({ player1: 0, player2: 0, isTiebreak: false, tiebreakScore: null });
  });
});

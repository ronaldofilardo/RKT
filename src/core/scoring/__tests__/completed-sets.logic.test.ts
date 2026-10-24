import { deriveMatchCompletedSets, deriveSetWinner } from '../completed-sets.logic';
import type { ScoringState } from '../types';

type SetInput = Partial<ScoringState['sets'][number]> & { player1: number; player2: number };

function makeState(
  sets: SetInput[],
  setsWon = { player1: 0, player2: 0 },
): ScoringState {
  return {
    sets: sets.map((s) => ({ isTiebreak: false, tiebreakScore: null, ...s })),
    currentGame: { player1: 0, player2: 0 },
    server: 'player1',
    isFinished: false,
    winner: null,
    setsWon,
    startedAt: null,
    secondServe: false,
  } as unknown as ScoringState;
}

describe('deriveSetWinner', () => {
  it('usa o desempate quando há diferença', () => {
    expect(deriveSetWinner({ player1: 6, player2: 7, tiebreakScore: { player1: 5, player2: 7 } })).toBe('player2');
  });

  it('usa os games quando não há desempate', () => {
    expect(deriveSetWinner({ player1: 6, player2: 4, tiebreakScore: null })).toBe('player1');
  });

  it('retorna null em empate (nunca força player2)', () => {
    expect(deriveSetWinner({ player1: 3, player2: 3, tiebreakScore: null })).toBeNull();
  });
});

describe('deriveMatchCompletedSets', () => {
  it('retorna vazio e 1 aba quando não há scoreState', () => {
    expect(deriveMatchCompletedSets(null, 'BEST_OF_3')).toEqual({
      completedCount: 0,
      availableSetsCount: 1,
      setsData: [],
    });
  });

  it('BEST_OF_3: conta sets concluídos (6-4 e 7-6 com tiebreak) e mantém o set em andamento', () => {
    const state = makeState(
      [
        { player1: 6, player2: 4 },
        { player1: 7, player2: 6, isTiebreak: true, tiebreakScore: { player1: 7, player2: 5 } },
        { player1: 3, player2: 2 },
      ],
      { player1: 2, player2: 0 },
    );

    const result = deriveMatchCompletedSets(state, 'BEST_OF_3');

    expect(result.completedCount).toBe(2);
    expect(result.availableSetsCount).toBe(2);
    expect(result.setsData.map((s) => s.isCompleted)).toEqual([true, true, false]);
    expect(result.setsData.map((s) => s.winner)).toEqual(['player1', 'player1', null]);
    expect(result.setsData[1].tiebreakScore).toEqual({ player1: 7, player2: 5 });
    expect(result.setsData[2].setNumber).toBe(3);
  });

  it('set em andamento empatado não é concluído e não tem vencedor', () => {
    const result = deriveMatchCompletedSets(makeState([{ player1: 4, player2: 4 }]), 'BEST_OF_3');

    expect(result.completedCount).toBe(0);
    expect(result.availableSetsCount).toBe(1);
    expect(result.setsData[0]).toMatchObject({ isCompleted: false, winner: null });
  });

  it('tiebreak 6-6 ainda em disputa (3x2) não conta como set concluído', () => {
    const state = makeState([
      { player1: 6, player2: 6, isTiebreak: true, tiebreakScore: { player1: 3, player2: 2 } },
    ]);

    const result = deriveMatchCompletedSets(state, 'BEST_OF_3');

    expect(result.completedCount).toBe(0);
    expect(result.setsData[0].winner).toBeNull();
    expect(result.setsData[0].tiebreakScore).toEqual({ player1: 3, player2: 2 });
  });

  it('SHORT_SET_2V2_NO_AD: fecha em 6-2 (4-2 ainda está em andamento)', () => {
    const closed = deriveMatchCompletedSets(makeState([{ player1: 6, player2: 2 }]), 'SHORT_SET_2V2_NO_AD');
    const open = deriveMatchCompletedSets(makeState([{ player1: 4, player2: 2 }]), 'SHORT_SET_2V2_NO_AD');

    expect(closed.setsData[0]).toMatchObject({ isCompleted: true, winner: 'player1' });
    expect(open.setsData[0]).toMatchObject({ isCompleted: false, winner: null });
  });

  it('MATCH_TB_10: o set único só conclui com 10 pontos e 2 de diferença', () => {
    const done = makeState([{ player1: 0, player2: 0, isTiebreak: true, tiebreakScore: { player1: 8, player2: 10 } }]);
    const open = makeState([{ player1: 0, player2: 0, isTiebreak: true, tiebreakScore: { player1: 9, player2: 8 } }]);

    expect(deriveMatchCompletedSets(done, 'MATCH_TB_10').setsData[0]).toMatchObject({
      isCompleted: true,
      winner: 'player2',
    });
    expect(deriveMatchCompletedSets(open, 'MATCH_TB_10').setsData[0].isCompleted).toBe(false);
  });

  it('formato desconhecido degrada para a regra padrão de 6 games', () => {
    const result = deriveMatchCompletedSets(makeState([{ player1: 6, player2: 3 }]), 'FORMATO_INEXISTENTE');

    expect(result.setsData[0]).toMatchObject({ isCompleted: true, winner: 'player1' });
  });
});

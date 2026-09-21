import { validateTransitionState } from '../matchValidator';
import type { MatchData } from '@/hooks/useScoringHandlers';
import type { MatchState } from '@prisma/client';
import type { ScoringState } from '@/core/scoring/types';

describe('matchValidator - isUndo and tiebreak bugfix', () => {
  it('should bypass SCORE_REGRESSION when isUndo is true', () => {
    const match: MatchData = {
      id: 'm1',
      format: 'BEST_OF_3',
      player1: { id: 'p1', name: 'P1' },
      player2: { id: 'p2', name: 'P2' },
      initialServerId: 'p1',
      state: 'IN_PROGRESS',
      scoreState: {
        sets: [{ player1: 6, player2: 4 }],
        currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null },
        setsWon: { player1: 1, player2: 0 },
        isFinished: false,
        winner: null,
      } as ScoringState,
    };

    const newState: MatchState = 'IN_PROGRESS';
    const oldScoreState = {
      sets: [{ player1: 5, player2: 4 }],
      currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null },
      setsWon: { player1: 0, player2: 0 },
      isFinished: false,
      winner: null,
    };

    // Sem isUndo, isso seria uma regressão bloqueada
    const resultNormal = validateTransitionState(match, newState, oldScoreState);
    expect(resultNormal.valid).toBe(false);
    expect(resultNormal.error).toMatch(/SCORE_REGRESSION/);

    // Com isUndo, deve ser válido
    const resultUndo = validateTransitionState(match, newState, oldScoreState, { isUndo: true });
    expect(resultUndo.valid).toBe(true);
  });

  it('should allow FINISHED -> IN_PROGRESS transition when isUndo is true', () => {
    const match: MatchData = {
      id: 'm1',
      format: 'BEST_OF_3',
      player1: { id: 'p1', name: 'P1' },
      player2: { id: 'p2', name: 'P2' },
      initialServerId: 'p1',
      state: 'FINISHED',
      scoreState: null,
    };

    const newState: MatchState = 'IN_PROGRESS';

    const resultUndo = validateTransitionState(match, newState, null, { isUndo: true });
    expect(resultUndo.valid).toBe(true);
  });

  it('should allow same tiebreak score regression if winner is different or tie', () => {
    // Esse teste cobre o bug 7, onde 10-8 -> 10-6 era rejeitado (mudança de pontuação do perdedor)
    const match: MatchData = {
      id: 'm1',
      format: 'BEST_OF_3',
      player1: { id: 'p1', name: 'P1' },
      player2: { id: 'p2', name: 'P2' },
      initialServerId: 'p1',
      state: 'IN_PROGRESS',
      scoreState: {
        sets: [{ player1: 6, player2: 6, isTiebreak: true, tiebreakScore: { player1: 10, player2: 8 } }],
        currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null },
        setsWon: { player1: 1, player2: 0 },
        isFinished: false,
        winner: null,
      } as ScoringState,
    };

    const newState: MatchState = 'IN_PROGRESS';
    const oldScoreState = {
      sets: [{ player1: 6, player2: 6, isTiebreak: true, tiebreakScore: { player1: 10, player2: 6 } }],
      currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null },
      setsWon: { player1: 1, player2: 0 },
      isFinished: false,
      winner: null,
    };

    // Aqui o vencedor (player1) é o mesmo, então não é tratado como erro
    // É uma correção (ex. 10-8 -> 10-6)
    const result = validateTransitionState(match, newState, oldScoreState);
    expect(result.valid).toBe(true);
  });
});

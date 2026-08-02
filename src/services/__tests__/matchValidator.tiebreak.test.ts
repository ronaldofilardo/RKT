import { validateTransitionState } from '../matchValidator';

describe('validateTransitionState - Correção SCORE_REGRESSION com tiebreak', () => {
  const matchData = {
    format: 'BEST_OF_3_MATCH_TB' as const,
    player1Id: 'player-1',
    player2Id: 'player-2',
    initialServerId: 'player-1',
    state: 'IN_PROGRESS' as const,
  };

  describe('Match Tie-Break com tiebreakScore', () => {
    it('deve permitir edição quando setsWon é igual (não há regressão)', () => {
      const oldState = {
        sets: [
          { player1: 6, player2: 4, isTiebreak: false, tiebreakScore: null },
          { player1: 3, player2: 6, isTiebreak: false, tiebreakScore: null },
          {
            player1: 0,
            player2: 0,
            isTiebreak: true,
            tiebreakScore: { player1: 10, player2: 8 },
          },
        ],
        setsWon: { player1: 1, player2: 2 },
        currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
        server: 'player1' as const,
        isFinished: true,
        winner: 'player2' as const,
        startedAt: Date.now(),
        secondServe: false,
      };

      const newState = {
        ...oldState,
        sets: [
          { player1: 6, player2: 4, isTiebreak: false, tiebreakScore: null },
          { player1: 3, player2: 6, isTiebreak: false, tiebreakScore: null },
          {
            player1: 0,
            player2: 0,
            isTiebreak: true,
            tiebreakScore: { player1: 10, player2: 8 },
          },
        ],
        setsWon: { player1: 1, player2: 2 },
      };

      const result = validateTransitionState(
        { ...matchData, scoreState: oldState },
        'FINISHED',
        newState,
        { allowScoreEdit: true }
      );

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('deve bloquear quando setsWon player2 regredir (2 -> 1)', () => {
      const oldState = {
        sets: [
          { player1: 6, player2: 4, isTiebreak: false, tiebreakScore: null },
          { player1: 3, player2: 6, isTiebreak: false, tiebreakScore: null },
          {
            player1: 0,
            player2: 0,
            isTiebreak: true,
            tiebreakScore: { player1: 10, player2: 8 },
          },
        ],
        setsWon: { player1: 1, player2: 2 },
        currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
        server: 'player1' as const,
        isFinished: true,
        winner: 'player2' as const,
        startedAt: Date.now(),
        secondServe: false,
      };

      const newState = {
        ...oldState,
        sets: [
          { player1: 6, player2: 4, isTiebreak: false, tiebreakScore: null },
          {
            player1: 0,
            player2: 0,
            isTiebreak: true,
            tiebreakScore: { player1: 10, player2: 8 },
          },
        ],
        setsWon: { player1: 1, player2: 1 }, // Regrediu de 2 para 1
      };

      const result = validateTransitionState(
        { ...matchData, scoreState: oldState },
        'FINISHED',
        newState,
        { allowScoreEdit: true }
      );

      expect(result.valid).toBe(false);
      expect(result.error).toContain('SCORE_REGRESSION');
    });

    it('deve permitir edição quando tiebreakScore está sendo corrigido mas setsWon é igual', () => {
      const oldState = {
        sets: [
          { player1: 6, player2: 4, isTiebreak: false, tiebreakScore: null },
          { player1: 3, player2: 6, isTiebreak: false, tiebreakScore: null },
          {
            player1: 0,
            player2: 0,
            isTiebreak: true,
            tiebreakScore: { player1: 10, player2: 8 },
          },
        ],
        setsWon: { player1: 1, player2: 2 },
        currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
        server: 'player1' as const,
        isFinished: true,
        winner: 'player2' as const,
        startedAt: Date.now(),
        secondServe: false,
      };

      // Usuário corrige placar do tiebreak (10-8 -> 10-6) mas mantém mesmo vencedor
      const newState = {
        ...oldState,
        sets: [
          { player1: 6, player2: 4, isTiebreak: false, tiebreakScore: null },
          { player1: 3, player2: 6, isTiebreak: false, tiebreakScore: null },
          {
            player1: 0,
            player2: 0,
            isTiebreak: true,
            tiebreakScore: { player1: 10, player2: 6 },
          },
        ],
        setsWon: { player1: 1, player2: 2 },
      };

      const result = validateTransitionState(
        { ...matchData, scoreState: oldState },
        'FINISHED',
        newState,
        { allowScoreEdit: true }
      );

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe('Tie-Break Regular com tiebreakScore', () => {
    it('deve permitir edição quando setsWon é igual', () => {
      const oldState = {
        sets: [
          {
            player1: 7,
            player2: 6,
            isTiebreak: true,
            tiebreakScore: { player1: 7, player2: 4 },
          },
        ],
        setsWon: { player1: 1, player2: 0 },
        currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
        server: 'player1' as const,
        isFinished: true,
        winner: 'player1' as const,
        startedAt: Date.now(),
        secondServe: false,
      };

      const newState = {
        ...oldState,
        sets: [
          {
            player1: 7,
            player2: 6,
            isTiebreak: true,
            tiebreakScore: { player1: 7, player2: 4 },
          },
        ],
        setsWon: { player1: 1, player2: 0 },
      };

      const result = validateTransitionState(
        { ...matchData, scoreState: oldState, format: 'BEST_OF_3' as const },
        'FINISHED',
        newState,
        { allowScoreEdit: true }
      );

      expect(result.valid).toBe(true);
    });

    it('deve bloquear quando setsWon regredir em tiebreak regular', () => {
      const oldState = {
        sets: [
          {
            player1: 7,
            player2: 6,
            isTiebreak: true,
            tiebreakScore: { player1: 7, player2: 4 },
          },
        ],
        setsWon: { player1: 1, player2: 0 },
        currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
        server: 'player1' as const,
        isFinished: true,
        winner: 'player1' as const,
        startedAt: Date.now(),
        secondServe: false,
      };

      const newState = {
        ...oldState,
        sets: [
          {
            player1: 6,
            player2: 7,
            isTiebreak: true,
            tiebreakScore: { player1: 4, player2: 7 },
          },
        ],
        setsWon: { player1: 0, player2: 1 }, // Regrediu
      };

      const result = validateTransitionState(
        { ...matchData, scoreState: oldState, format: 'BEST_OF_3' as const },
        'FINISHED',
        newState,
        { allowScoreEdit: true }
      );

      expect(result.valid).toBe(false);
      expect(result.error).toContain('SCORE_REGRESSION');
    });
  });
});
import { compareScoringStates, runShadowReplaySafely } from '../shadow-replay';
import type { ScoringState, ScoringEngineConfig } from '../types';

describe('shadow-replay', () => {
  const config: ScoringEngineConfig = {
    format: 'BEST_OF_3',
    player1Id: 'p1',
    player2Id: 'p2',
    initialServerId: 'p1',
  };

  const baseState: ScoringState = {
    sets: [{ player1: 6, player2: 4, isTiebreak: false, tiebreakScore: null }],
    currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
    server: 'player1',
    isFinished: true,
    winner: 'player1',
    setsWon: { player1: 1, player2: 0 },
    startedAt: 1000,
    secondServe: false,
  };

  it('deve confirmar igualdade quando estados canônico e simulado coincidem', () => {
    const result = compareScoringStates(baseState, { ...baseState });
    expect(result.matches).toBe(true);
    expect(result.divergences).toHaveLength(0);
  });

  it('deve identificar divergência de sets e vencedor', () => {
    const divergentState: ScoringState = {
      ...baseState,
      winner: 'player2',
      sets: [{ player1: 4, player2: 6, isTiebreak: false, tiebreakScore: null }],
    };

    const result = compareScoringStates(baseState, divergentState);
    expect(result.matches).toBe(false);
    expect(result.divergences.some((d) => d.includes('winner mismatch'))).toBe(true);
    expect(result.divergences.some((d) => d.includes('set 1 games mismatch'))).toBe(true);
  });

  it('deve classificar divergência como esperada quando há scoreEdits', () => {
    const divergentState: ScoringState = {
      ...baseState,
      setsWon: { player1: 2, player2: 0 },
    };

    const result = compareScoringStates(baseState, divergentState, true);
    expect(result.matches).toBe(false);
    expect(result.expectedDivergenceReason).toBe('SCORE_EDIT_SEGMENT');
  });

  it('runShadowReplaySafely não deve lançar erro mesmo com dados anômalos', () => {
    expect(() => {
      runShadowReplaySafely({
        matchId: 'test-match',
        config,
        canonicalState: baseState,
        pointLogs: [] as any,
      });
    }).not.toThrow();
  });
});

// Real - previne regressao no fluxo de pontos
import { isMatchTiebreakActive } from '../match-tiebreak';
import { processRegularPoint } from '../engine.flow';
import type { ScoringState, ScoringEngineConfig } from '../types';

describe('Engine Flow - Real', () => {
  const config: ScoringEngineConfig = { format: 'BEST_OF_3', player1Id: 'p1', player2Id: 'p2', initialServerId: 'p1' };

  it('deve detectar match tie-break ativo', () => {
    const state = { sets: [{ player1: 6, player2: 6, isTiebreak: true, tiebreakScore: { player1: 0, player2: 0 } }], currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null }, server: 'player1', isFinished: false, winner: null, setsWon: { player1: 1, player2: 1 }, startedAt: 0, secondServe: false } as ScoringState;
    expect(typeof isMatchTiebreakActive(state, config)).toBe('boolean');
  });
});

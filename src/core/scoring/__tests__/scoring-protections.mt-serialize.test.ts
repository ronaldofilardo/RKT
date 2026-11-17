/**
 * Split de scoring-protections.test.ts — PROTEÇÃO #1 (serialização): round-trip
 * serialize → fromSerialized de match tie-break completo. Asserções 1:1.
 */
import { ScoringEngine } from '@/core/scoring/engine';
import type { ScoringState } from '@/core/scoring/types';

describe('PROTEÇÃO #1: Serialização de Match Tie-Break', () => {
  it("deve serializar e restaurar match tie-break corretamente", () => {
    const config = {
      format: 'BEST_OF_3_MATCH_TB' as const,
      player1Id: 'p1',
      player2Id: 'p2',
      initialServerId: 'p1',
    };
    const initialState: ScoringState = {
      sets: [{
        player1: 0,
        player2: 0,
        isTiebreak: true,
        tiebreakScore: { player1: 10, player2: 7 },
      }],
      currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
      server: 'player1',
      isFinished: true,
      winner: 'player1',
      setsWon: { player1: 1, player2: 0 },
      startedAt: Date.now(),
      secondServe: false,
    };
    const engine = new ScoringEngine(config, initialState);
    const serialized = engine.serialize();
    const restored = ScoringEngine.fromSerialized(config, serialized);
    const restoredState = restored.getState();
    expect(restoredState.sets[0].isTiebreak).toBe(true);
    expect(restoredState.sets[0].tiebreakScore).toEqual({ player1: 10, player2: 7 });
    expect(restoredState.isFinished).toBe(true);
    expect(restoredState.winner).toBe('player1');
  });
});

/**
 * Split de engine-edge-cases.test.ts — describe "ScoringEngine - server
 * determination": servidor inicial derivado de initialServerId. Asserções 1:1.
 */
import { ScoringEngine } from '../engine';

describe('ScoringEngine - server determination', () => {
  it('deve setar server como player2 se initialServerId é player2Id', () => {
    const engine = new ScoringEngine({
      format: 'BEST_OF_3',
      player1Id: 'p1',
      player2Id: 'p2',
      initialServerId: 'p2',
    });
    expect(engine.getState().server).toBe('player2');
  });
});

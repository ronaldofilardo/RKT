/**
 * Split de engine.characterization.test.ts — describe "applyPoint — deuce and
 * advantage": 40-40, vantagem, retorno ao deuce e game no deuce. Asserções 1:1.
 */
import { makeEngine, toDeuce, winPoints } from './engineCharacterizationTestKit';

describe('applyPoint — deuce and advantage', () => {
  it('sets isDeuce at 3-3', () => {
    const engine = makeEngine();
    toDeuce(engine);
    const state = engine.getState();
    expect(state.currentGame.isDeuce).toBe(true);
    expect(state.currentGame.advantage).toBeNull();
  });

  it('sets advantage for player1 after deuce', () => {
    const engine = makeEngine();
    toDeuce(engine);
    winPoints(engine, 'p1', 1, 100);
    const state = engine.getState();
    expect(state.currentGame.advantage).toBe('player1');
  });

  it('returns to deuce when advantage lost', () => {
    const engine = makeEngine();
    toDeuce(engine);
    winPoints(engine, 'p1', 1, 100);
    winPoints(engine, 'p2', 1, 110);
    const state = engine.getState();
    expect(state.currentGame.isDeuce).toBe(true);
    expect(state.currentGame.advantage).toBeNull();
  });

  it('wins game when advantage player wins next point', () => {
    const engine = makeEngine();
    toDeuce(engine);
    winPoints(engine, 'p1', 1, 100);
    winPoints(engine, 'p1', 1, 110);
    const state = engine.getState();
    expect(state.sets[0].player1).toBe(1);
    expect(state.currentGame.player1).toBe(0);
    expect(state.currentGame.player2).toBe(0);
  });
});

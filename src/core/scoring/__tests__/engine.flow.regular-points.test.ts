/**
 * Split de engine.flow.characterization.test.ts — describes "applyRegularPoint — Standard scoring (non-No-Ad)" e "applyRegularPoint — No-Ad scoring". Asserções 1:1.
 */
import { applyRegularPoint } from '../engine.flow';
import { createConfig, createInitialState, playRegular, toDeuce } from './engineFlowTestKit';

describe('applyRegularPoint — Standard e No-Ad scoring', () => {
  describe('applyRegularPoint — Standard scoring (non-No-Ad)', () => {
    const config = createConfig('BEST_OF_3');
    it('increments winner score from 0-0', () => {
      const result = applyRegularPoint('player1', createInitialState(config), config);
      expect(result.currentGame.player1).toBe(1);
      expect(result.currentGame.player2).toBe(0);
    });

    it('progresses 15-30-40 correctly', () => {
      const state = playRegular('player1', createInitialState(config), config, 3); // 15-0, 30-0, 40-0
      expect(state.currentGame.player1).toBe(3);
      expect(state.currentGame.player2).toBe(0);
    });

    it('handles deuce at 40-40', () => {
      const state = toDeuce(createInitialState(config), config);
      expect(state.currentGame.isDeuce).toBe(true);
      expect(state.currentGame.player1).toBe(3);
      expect(state.currentGame.player2).toBe(3);
    });

    it('gives advantage after deuce (isDeuce stays true until game won)', () => {
      const state = playRegular('player1', toDeuce(createInitialState(config), config), config, 1);
      expect(state.currentGame.advantage).toBe('player1');
      expect(state.currentGame.isDeuce).toBe(true);
    });

    it('wins game when advantage holder wins next point', () => {
      let state = toDeuce(createInitialState(config), config);
      state = playRegular('player1', state, config, 2); // adv p1 e game p1
      expect(state.sets[0].player1).toBe(1);
      expect(state.currentGame.player1).toBe(0);
      expect(state.currentGame.player2).toBe(0);
      expect(state.server).toBe('player2');
    });

    it('returns to deuce when advantage lost', () => {
      let state = toDeuce(createInitialState(config), config);
      state = playRegular('player1', state, config, 1); // adv p1
      state = playRegular('player2', state, config, 1); // back to deuce
      expect(state.currentGame.isDeuce).toBe(true);
      expect(state.currentGame.advantage).toBeNull();
    });
  });

  describe('applyRegularPoint — No-Ad scoring (BEST_OF_3_NO_AD, SHORT_SET_2V2_NO_AD)', () => {
    const configNoAd = createConfig('BEST_OF_3_NO_AD');
    const configShort = createConfig('SHORT_SET_2V2_NO_AD');
    it('at 3-3 sets isDeuce=true (ponto decisivo), then next point completes game', () => {
      let state = toDeuce(createInitialState(configNoAd), configNoAd);
      expect(state.currentGame.isDeuce).toBe(true);
      expect(state.sets.length).toBe(0);
      state = playRegular('player2', state, configNoAd, 1); // sudden death
      expect(state.sets[0].player2).toBe(1);
      expect(state.currentGame.player1).toBe(0);
      expect(state.currentGame.player2).toBe(0);
    });

    it('decides game at next point after 3-3 in No-Ad (sudden death)', () => {
      let state = toDeuce(createInitialState(configNoAd), configNoAd);
      expect(state.currentGame.isDeuce).toBe(true);
      state = playRegular('player1', state, configNoAd, 1);
      expect(state.sets[0].player1).toBe(1);
      expect(state.currentGame.player1).toBe(0);
    });

    it('SHORT_SET_2V2_NO_AD starts at 2-2 games', () => {
      const state = createInitialState(configShort);
      expect(state.sets[0]?.player1).toBeUndefined();
      expect(state.currentGame.player1).toBe(0);
    });
  });
});

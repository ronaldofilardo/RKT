/**
 * Split de engine.flow.characterization.test.ts — describes "getSetsToWin",
 * "usesNoAd", "isFinalSet" e "getGamesToTiebreak": regras de configuração por
 * formato. Asserções 1:1.
 */
import { getGamesToTiebreak, getSetsToWin, isFinalSet, usesNoAd } from '../engine.flow';
import { createConfig } from './engineFlowTestKit';

describe('regras de configuração por formato', () => {
  describe('getSetsToWin', () => {
    it('returns 3 for BEST_OF_5', () => {
      expect(getSetsToWin(createConfig('BEST_OF_5'))).toBe(3);
    });

    it('returns 2 for BEST_OF_3 variants', () => {
      expect(getSetsToWin(createConfig('BEST_OF_3'))).toBe(2);
      expect(getSetsToWin(createConfig('BEST_OF_3_MATCH_TB'))).toBe(2);
      expect(getSetsToWin(createConfig('BEST_OF_3_NO_AD'))).toBe(2);
      expect(getSetsToWin(createConfig('SHORT_SET_2V2_NO_AD'))).toBe(2);
    });

    it('returns 1 for MATCH_TB_10 and PRO_SET_8', () => {
      expect(getSetsToWin(createConfig('MATCH_TB_10'))).toBe(1);
      expect(getSetsToWin(createConfig('PRO_SET_8'))).toBe(1);
    });
  });

  describe('usesNoAd', () => {
    it('returns true for SHORT_SET_2V2_NO_AD and BEST_OF_3_NO_AD', () => {
      expect(usesNoAd(createConfig('SHORT_SET_2V2_NO_AD'))).toBe(true);
      expect(usesNoAd(createConfig('BEST_OF_3_NO_AD'))).toBe(true);
    });

    it('returns false for other formats', () => {
      expect(usesNoAd(createConfig('BEST_OF_3'))).toBe(false);
      expect(usesNoAd(createConfig('BEST_OF_5'))).toBe(false);
      expect(usesNoAd(createConfig('MATCH_TB_10'))).toBe(false);
    });
  });

  describe('isFinalSet', () => {
    it('returns true only for PRO_SET_8', () => {
      expect(isFinalSet(createConfig('PRO_SET_8'))).toBe(true);
      expect(isFinalSet(createConfig('BEST_OF_3'))).toBe(false);
      expect(isFinalSet(createConfig('BEST_OF_5'))).toBe(false);
    });
  });

  describe('getGamesToTiebreak', () => {
    it('returns 9 for PRO_SET_8', () => {
      expect(getGamesToTiebreak(createConfig('PRO_SET_8'))).toBe(9);
    });

    it('returns 6 for SHORT_SET_2V2_NO_AD', () => {
      expect(getGamesToTiebreak(createConfig('SHORT_SET_2V2_NO_AD'))).toBe(6);
    });

    it('returns 6 for other formats', () => {
      expect(getGamesToTiebreak(createConfig('BEST_OF_3'))).toBe(6);
      expect(getGamesToTiebreak(createConfig('BEST_OF_5'))).toBe(6);
      expect(getGamesToTiebreak(createConfig('MATCH_TB_10'))).toBe(6);
    });
  });
});

import {
  getMatchFormatRules,
  isMatchTiebreakActive,
  validateSetScore,
} from '../matchConfig';

describe('matchConfig - Regressoes Reais', () => {
  describe('getMatchFormatRules', () => {
    it('deve retornar regras corretas para BEST_OF_3', () => {
      const rules = getMatchFormatRules('BEST_OF_3');
      expect(rules.setsToWin).toBe(2);
      expect(rules.gamesPerSet).toBe(6);
      expect(rules.tiebreakAt).toBe(6);
      expect(rules.useAdvantage).toBe(true);
    });

    it('deve retornar regras corretas para MATCH_TB_10', () => {
      const rules = getMatchFormatRules('MATCH_TB_10');
      expect(rules.setsToWin).toBe(1);
      expect(rules.gamesPerSet).toBe(0);
      expect(rules.matchTiebreakPoints).toBe(10);
    });

    it('deve lancar erro para formato nao suportado', () => {
      expect(() => getMatchFormatRules('INVALID_FORMAT' as any)).toThrow(
        'Formato de partida não suportado'
      );
    });
  });

  describe('isMatchTiebreakActive', () => {
    it('deve retornar true imediatamente para formato MATCH_TB_10', () => {
      expect(isMatchTiebreakActive('MATCH_TB_10', 1, 0, 0)).toBe(true);
    });

    it('deve retornar true no terceiro set quando empatado em 1x1 em BEST_OF_3_MATCH_TB', () => {
      expect(isMatchTiebreakActive('BEST_OF_3_MATCH_TB', 3, 1, 1)).toBe(true);
      expect(isMatchTiebreakActive('BEST_OF_3_MATCH_TB', 2, 1, 0)).toBe(false);
    });
  });

  describe('validateSetScore', () => {
    const standardRules = getMatchFormatRules('BEST_OF_3');

    it('deve considerar set completo com 6/4 (vantagem de 2 games)', () => {
      const result = validateSetScore(6, 4, standardRules);
      expect(result.complete).toBe(true);
      expect(result.winner).toBe('PLAYER_1');
      expect(result.isTiebreak).toBe(false);
    });

    it('deve indicar inTiebreak quando placar estiver 6/6', () => {
      const result = validateSetScore(6, 6, standardRules);
      expect(result.complete).toBe(false);
      expect(result.inTiebreak).toBe(true);
    });

    it('deve considerar set completo por tiebreak em 7/6', () => {
      const result = validateSetScore(7, 6, standardRules);
      expect(result.complete).toBe(true);
      expect(result.isTiebreak).toBe(true);
    });
  });
});

import { calculateBackoffDelay, TIMEOUTS, TIEBREAK, PERSIST } from '../constants';

describe('constants - Regressoes Reais', () => {
  describe('calculateBackoffDelay', () => {
    it('deve calcular backoff exponencial corretamente para as tentativas', () => {
      expect(calculateBackoffDelay(1, PERSIST.BASE_DELAY_MS, 2)).toBe(1000);
      expect(calculateBackoffDelay(2, PERSIST.BASE_DELAY_MS, 2)).toBe(2000);
      expect(calculateBackoffDelay(3, PERSIST.BASE_DELAY_MS, 2)).toBe(4000);
    });

    it('deve respeitar multiplicador e base customizados', () => {
      expect(calculateBackoffDelay(1, 500, 3)).toBe(500);
      expect(calculateBackoffDelay(2, 500, 3)).toBe(1500);
    });
  });

  describe('invariantes de constantes de tenis', () => {
    it('deve definir pontuação mínima de tiebreak padrão em 7 e match tiebreak em 10', () => {
      expect(TIEBREAK.MIN_WIN_POINTS_STANDARD).toBe(7);
      expect(TIEBREAK.MIN_WIN_POINTS_MATCH).toBe(10);
      expect(TIEBREAK.WIN_MARGIN).toBe(2);
    });

    it('deve possuir timeouts positivos para operacoes de rede e lock', () => {
      expect(TIMEOUTS.LOCK_TTL_MS).toBeGreaterThan(0);
      expect(TIMEOUTS.DEBOUNCE_MS).toBeGreaterThan(0);
      expect(TIMEOUTS.MATCH_FETCH_TIMEOUT_MS).toBeGreaterThan(0);
    });
  });
});

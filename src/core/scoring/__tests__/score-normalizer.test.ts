import { normalizeScoreState, isMatchTiebreakSetIndex } from '../score-normalizer';
import type { TennisFormat } from '../types';

describe('isMatchTiebreakSetIndex', () => {
  it('deve retornar true para set 1 em MATCH_TB_10', () => {
    expect(isMatchTiebreakSetIndex(0, 1, 'MATCH_TB_10')).toBe(true);
  });

  it('deve retornar false para set 2 em MATCH_TB_10', () => {
    expect(isMatchTiebreakSetIndex(1, 2, 'MATCH_TB_10')).toBe(false);
  });

  it('deve retornar true para 5º set em BEST_OF_5 quando 2-2', () => {
    expect(isMatchTiebreakSetIndex(4, 5, 'BEST_OF_5', { p1Won: 2, p2Won: 2 })).toBe(true);
  });

  it('deve retornar false para 5º set em BEST_OF_5 quando não 2-2', () => {
    expect(isMatchTiebreakSetIndex(4, 5, 'BEST_OF_5', { p1Won: 2, p2Won: 1 })).toBe(false);
  });

  it('deve retornar false para set não-decisivo em BEST_OF_5', () => {
    expect(isMatchTiebreakSetIndex(0, 5, 'BEST_OF_5', { p1Won: 0, p2Won: 0 })).toBe(false);
  });

  it('deve retornar true para 3º set em BEST_OF_3_MATCH_TB quando 1-1', () => {
    expect(isMatchTiebreakSetIndex(2, 3, 'BEST_OF_3_MATCH_TB', { p1Won: 1, p2Won: 1 })).toBe(true);
  });

  it('deve retornar false para 3º set em BEST_OF_3_MATCH_TB quando não 1-1', () => {
    expect(isMatchTiebreakSetIndex(2, 3, 'BEST_OF_3_MATCH_TB', { p1Won: 1, p2Won: 0 })).toBe(false);
  });

  it('deve retornar true para 3º set em BEST_OF_3_NO_AD quando 1-1', () => {
    expect(isMatchTiebreakSetIndex(2, 3, 'BEST_OF_3_NO_AD', { p1Won: 1, p2Won: 1 })).toBe(true);
  });

  it('deve retornar true para 3º set em SHORT_SET_2V2_NO_AD quando 1-1', () => {
    expect(isMatchTiebreakSetIndex(2, 3, 'SHORT_SET_2V2_NO_AD', { p1Won: 1, p2Won: 1 })).toBe(true);
  });

  it('deve retornar false para formatos sem match tiebreak', () => {
    expect(isMatchTiebreakSetIndex(0, 1, 'BEST_OF_3')).toBe(false);
    expect(isMatchTiebreakSetIndex(2, 3, 'PRO_SET_8')).toBe(false);
  });
});

describe('normalizeScoreState', () => {
  it('deve retornar null para input null/undefined', () => {
    expect(normalizeScoreState(null)).toBeNull();
    expect(normalizeScoreState(undefined)).toBeNull();
  });

  it('deve retornar null para string JSON inválida', () => {
    expect(normalizeScoreState('not json')).toBeNull();
  });

  it('deve parsear string JSON válida', () => {
    const input = JSON.stringify({
      sets: [{ player1: 0, player2: 0 }],
      currentGame: { player1: 0, player2: 0 },
    });

    const result = normalizeScoreState(input);
    expect(result).not.toBeNull();
    expect(result!.sets).toHaveLength(1);
  });

  it('deve extrair state de snapshot serializado { state, history }', () => {
    const input = {
      state: {
        sets: [{ player1: 6, player2: 4 }],
        currentGame: { player1: 0, player2: 0 },
      },
      history: [],
    };

    const result = normalizeScoreState(input);
    expect(result).not.toBeNull();
    expect(result!.sets[0].player1).toBe(6);
  });

  it('deve retornar null quando sets é null', () => {
    const input = { sets: null, currentGame: {} };
    expect(normalizeScoreState(input)).toBeNull();
  });

  it('deve adicionar currentGame default quando ausente', () => {
    const input = {
      sets: [{ player1: 0, player2: 0 }],
    };

    const result = normalizeScoreState(input);
    expect(result).not.toBeNull();
    expect(result!.currentGame).toEqual({
      player1: 0,
      player2: 0,
      isDeuce: false,
      advantage: null,
    });
  });

  describe('match tiebreak corruption fix (Bug #4)', () => {
    it('deve corromper set de MT em MATCH_TB_10 para formato canônico', () => {
      const input = {
        sets: [{ player1: 8, player2: 6, isTiebreak: false, tiebreakScore: null }],
        currentGame: { player1: 0, player2: 0 },
      };

      const result = normalizeScoreState(input, 'MATCH_TB_10');
      expect(result).not.toBeNull();
      expect(result!.sets[0].isTiebreak).toBe(true);
      expect(result!.sets[0].tiebreakScore).toEqual({ player1: 8, player2: 6 });
      expect(result!.sets[0].player1).toBe(0);
      expect(result!.sets[0].player2).toBe(0);
    });

    it('deve corromper set de MT em BEST_OF_3_MATCH_TB no 3º set', () => {
      const input = {
        sets: [
          { player1: 6, player2: 4, isTiebreak: false },
          { player1: 4, player2: 6, isTiebreak: false },
          { player1: 10, player2: 8, isTiebreak: false, tiebreakScore: null },
        ],
        currentGame: { player1: 0, player2: 0 },
      };

      const result = normalizeScoreState(input, 'BEST_OF_3_MATCH_TB');
      expect(result).not.toBeNull();
      expect(result!.sets[2].isTiebreak).toBe(true);
      expect(result!.sets[2].tiebreakScore).toEqual({ player1: 10, player2: 8 });
      expect(result!.sets[2].player1).toBe(0);
      expect(result!.sets[2].player2).toBe(0);
    });

    it('NÃO deve alterar set que já tem isTiebreak true', () => {
      const input = {
        sets: [{ player1: 0, player2: 0, isTiebreak: true, tiebreakScore: { player1: 5, player2: 3 } }],
        currentGame: { player1: 0, player2: 0 },
      };

      const result = normalizeScoreState(input, 'MATCH_TB_10');
      expect(result).not.toBeNull();
      expect(result!.sets[0].tiebreakScore).toEqual({ player1: 5, player2: 3 });
    });

    it('NÃO deve alterar set que já tem tiebreakScore', () => {
      const input = {
        sets: [{ player1: 7, player2: 6, isTiebreak: false, tiebreakScore: { player1: 7, player2: 5 } }],
        currentGame: { player1: 0, player2: 0 },
      };

      const result = normalizeScoreState(input, 'BEST_OF_3');
      expect(result).not.toBeNull();
      expect(result!.sets[0].tiebreakScore).toEqual({ player1: 7, player2: 5 });
    });

    it('NÃO deve alterar set normal (não é posição de MT)', () => {
      const input = {
        sets: [
          { player1: 6, player2: 4, isTiebreak: false, tiebreakScore: null },
          { player1: 3, player2: 6, isTiebreak: false, tiebreakScore: null },
        ],
        currentGame: { player1: 0, player2: 0 },
      };

      const result = normalizeScoreState(input, 'BEST_OF_3_MATCH_TB');
      expect(result).not.toBeNull();
      expect(result!.sets[0].player1).toBe(6);
      expect(result!.sets[1].player2).toBe(6);
    });

    it('deve corromper 5º set de BEST_OF_5 quando 2-2', () => {
      const input = {
        sets: [
          { player1: 6, player2: 4 },
          { player1: 4, player2: 6 },
          { player1: 6, player2: 4 },
          { player1: 4, player2: 6 },
          { player1: 8, player2: 6 },
        ],
        currentGame: { player1: 0, player2: 0 },
      };

      const result = normalizeScoreState(input, 'BEST_OF_5');
      expect(result).not.toBeNull();
      expect(result!.sets[4].isTiebreak).toBe(true);
      expect(result!.sets[4].tiebreakScore).toEqual({ player1: 8, player2: 6 });
    });

    it('NÃO deve corromper 5º set de BEST_OF_5 quando placar anterior não é 2-2', () => {
      const input = {
        sets: [
          { player1: 6, player2: 4 },
          { player1: 6, player2: 4 },
          { player1: 6, player2: 4 },
          { player1: 4, player2: 6 },
          { player1: 8, player2: 6 },
        ],
        currentGame: { player1: 0, player2: 0 },
      };

      // p1Won=3, p2Won=1 após 4 sets → 5º set não é MT
      const result = normalizeScoreState(input, 'BEST_OF_5');
      expect(result).not.toBeNull();
      expect(result!.sets[4].isTiebreak).toBeFalsy();
    });

    it('deve corromper SHORT_SET_2V2_NO_AD no 3º set quando 1-1', () => {
      const input = {
        sets: [
          { player1: 4, player2: 2 },
          { player1: 2, player2: 4 },
          { player1: 5, player2: 3 },
        ],
        currentGame: { player1: 0, player2: 0 },
      };

      const result = normalizeScoreState(input, 'SHORT_SET_2V2_NO_AD');
      expect(result).not.toBeNull();
      expect(result!.sets[2].isTiebreak).toBe(true);
      expect(result!.sets[2].tiebreakScore).toEqual({ player1: 5, player2: 3 });
    });
  });

  describe('regular tiebreak reconstruction from history', () => {
    it('deve reconstruir tiebreakScore a partir do history para set 7-6', () => {
      const input = {
        state: {
          sets: [{ player1: 7, player2: 6, isTiebreak: false, tiebreakScore: null }],
          currentGame: { player1: 0, player2: 0 },
        },
        history: [
          {
            stateBefore: {
              sets: [{ player1: 6, player2: 6, isTiebreak: true, tiebreakScore: { player1: 7, player2: 5 } }],
            },
          },
        ],
      };

      const result = normalizeScoreState(input, 'BEST_OF_3');
      expect(result).not.toBeNull();
      expect(result!.sets[0].tiebreakScore).toEqual({ player1: 7, player2: 5 });
    });

    it('deve reconstruir tiebreakScore para set 6-7', () => {
      const input = {
        state: {
          sets: [{ player1: 6, player2: 7, isTiebreak: false, tiebreakScore: null }],
          currentGame: { player1: 0, player2: 0 },
        },
        history: [
          {
            stateBefore: {
              sets: [{ player1: 6, player2: 6, isTiebreak: true, tiebreakScore: { player1: 5, player2: 7 } }],
            },
          },
        ],
      };

      const result = normalizeScoreState(input, 'BEST_OF_3');
      expect(result).not.toBeNull();
      expect(result!.sets[0].tiebreakScore).toEqual({ player1: 5, player2: 7 });
    });

    it('NÃO deve alterar set que não é 7-6 ou 6-7', () => {
      const input = {
        state: {
          sets: [{ player1: 6, player2: 4, isTiebreak: false, tiebreakScore: null }],
          currentGame: { player1: 0, player2: 0 },
        },
        history: [],
      };

      const result = normalizeScoreState(input, 'BEST_OF_3');
      expect(result).not.toBeNull();
      expect(result!.sets[0].tiebreakScore).toBeNull();
    });

    it('deve buscar history de trás pra frente para reconstruir', () => {
      const input = {
        state: {
          sets: [{ player1: 7, player2: 6, isTiebreak: false, tiebreakScore: null }],
          currentGame: { player1: 0, player2: 0 },
        },
        history: [
          {
            stateBefore: {
              sets: [{ player1: 5, player2: 6, isTiebreak: false }],
            },
          },
          {
            stateBefore: {
              sets: [{ player1: 6, player2: 6, isTiebreak: true, tiebreakScore: { player1: 7, player2: 6 } }],
            },
          },
        ],
      };

      const result = normalizeScoreState(input, 'BEST_OF_3');
      expect(result).not.toBeNull();
      expect(result!.sets[0].tiebreakScore).toEqual({ player1: 7, player2: 6 });
    });
  });

  describe('format without match tiebreak', () => {
    it('não deve alterar sets para BEST_OF_3 (sem MT)', () => {
      const input = {
        sets: [{ player1: 6, player2: 4 }],
        currentGame: { player1: 0, player2: 0 },
      };

      const result = normalizeScoreState(input, 'BEST_OF_3');
      expect(result).not.toBeNull();
      expect(result!.sets[0].player1).toBe(6);
    });
  });
});

/**
 * CHARACTERIZATION — editScoreHelpers (validateSetResult MATCH_TB_10).
 * Divisão da suíte original editScoreHelpers.characterization.test.ts (513L);
 * cabeçalho completo (TD-046) e builders: editScoreHelpersTestKit.ts.
 */
import { validateSetResult } from '@/core/scoring/edit-score-domain';

describe('editScoreHelpers (characterization) — validateSetResult (MATCH_TB_10)', () => {
  it('deve validar MT completo 10-8', () => {
    const result = validateSetResult({ p1Games: 10, p2Games: 8 }, 'MATCH_TB_10');
    expect(result.isValid).toBe(true);
    expect(result.winner).toBe('player1');
  });

  it('deve validar MT completo 8-10', () => {
    const result = validateSetResult({ p1Games: 8, p2Games: 10 }, 'MATCH_TB_10');
    expect(result.isValid).toBe(true);
    expect(result.winner).toBe('player2');
  });

  it('deve aceitar MT sem margem de 2 (10-9) como válido parcial', () => {
    // Comportamento observado: 10-9 é considerado válido (isPartial=true)
    const result = validateSetResult({ p1Games: 10, p2Games: 9 }, 'MATCH_TB_10');
    expect(result.isValid).toBe(true);
    expect(result.isPartial).toBe(true);
  });

  it('deve aceitar MT parcial 5-3', () => {
    const result = validateSetResult({ p1Games: 5, p2Games: 3 }, 'MATCH_TB_10');
    expect(result.isValid).toBe(true);
    expect(result.isPartial).toBe(true);
  });

  it('deve rejeitar valores negativos', () => {
    const result = validateSetResult({ p1Games: -1, p2Games: 5 }, 'MATCH_TB_10');
    expect(result.isValid).toBe(false);
    expect(result.error).toMatch(/negativ/i);
  });

  it('deve aceitar 0-0 como parcial', () => {
    const result = validateSetResult({ p1Games: 0, p2Games: 0 }, 'MATCH_TB_10');
    expect(result.isValid).toBe(true);
    expect(result.isPartial).toBe(true);
  });
});

/**
 * CHARACTERIZATION — editScoreHelpers (validateMatchTiebreakInput).
 * Divisão da suíte original editScoreHelpers.characterization.test.ts (513L);
 * cabeçalho completo (TD-046) e builders: editScoreHelpersTestKit.ts.
 */
import { validateMatchTiebreakInput } from '@/core/scoring/edit-score-domain';

describe('editScoreHelpers (characterization) — validateMatchTiebreakInput', () => {
  it('deve validar MT completo 10-8', () => {
    const result = validateMatchTiebreakInput({ p1Points: 10, p2Points: 8 });
    expect(result.isValid).toBe(true);
    expect(result.winner).toBe('player1');
  });

  it('deve validar MT completo 12-10', () => {
    const result = validateMatchTiebreakInput({ p1Points: 12, p2Points: 10 });
    expect(result.isValid).toBe(true);
    expect(result.winner).toBe('player1');
  });

  it('deve aceitar MT sem margem 2 (10-9) como válido parcial', () => {
    // Comportamento observado: retorna isValid=true, isPartial=true
    const result = validateMatchTiebreakInput({ p1Points: 10, p2Points: 9 });
    expect(result.isValid).toBe(true);
    expect(result.isPartial).toBe(true);
  });

  it('deve aceitar parcial 5-3', () => {
    const result = validateMatchTiebreakInput({ p1Points: 5, p2Points: 3 });
    expect(result.isValid).toBe(true);
    expect(result.isPartial).toBe(true);
  });

  it('deve rejeitar valores negativos', () => {
    expect(validateMatchTiebreakInput({ p1Points: -1, p2Points: 5 }).isValid).toBe(false);
  });

  it('deve aceitar 0-0 como parcial', () => {
    const result = validateMatchTiebreakInput({ p1Points: 0, p2Points: 0 });
    expect(result.isValid).toBe(true);
    expect(result.isPartial).toBe(true);
  });
});

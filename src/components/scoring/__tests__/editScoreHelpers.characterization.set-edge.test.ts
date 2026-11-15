/**
 * CHARACTERIZATION — editScoreHelpers (validateSetResult edge cases).
 * Divisão da suíte original editScoreHelpers.characterization.test.ts (513L);
 * cabeçalho completo (TD-046) e builders: editScoreHelpersTestKit.ts.
 */
import { validateSetResult } from '@/core/scoring/edit-score-domain';

describe('editScoreHelpers (characterization) — validateSetResult (edge cases)', () => {
  it('deve rejeitar valores negativos', () => {
    expect(validateSetResult({ p1Games: -1, p2Games: 0 }, 'BEST_OF_3').isValid).toBe(false);
    expect(validateSetResult({ p1Games: 0, p2Games: -1 }, 'BEST_OF_3').isValid).toBe(false);
  });

  it('deve aceitar 0-0 como parcial', () => {
    const result = validateSetResult({ p1Games: 0, p2Games: 0 }, 'BEST_OF_3');
    expect(result.isValid).toBe(true);
    expect(result.isPartial).toBe(true);
  });

  it('deve aceitar 1-0 como parcial', () => {
    const result = validateSetResult({ p1Games: 1, p2Games: 0 }, 'BEST_OF_3');
    expect(result.isValid).toBe(true);
    expect(result.isPartial).toBe(true);
  });
});

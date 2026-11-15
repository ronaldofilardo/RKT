/**
 * CHARACTERIZATION — editScoreHelpers (validateSetResult standard, parte 2:
 * tiebreak, limites e win-by-2). Divisão da suíte original
 * editScoreHelpers.characterization.test.ts (513L); doc: editScoreHelpersTestKit.ts.
 */
import { validateSetResult } from '@/core/scoring/edit-score-domain';

describe('editScoreHelpers (characterization) — validateSetResult (standard: tiebreak/limites)', () => {
  it('deve identificar 7x6 como set encerrado com tiebreak', () => {
    const result = validateSetResult({ p1Games: 7, p2Games: 6 }, 'BEST_OF_3');
    expect(result.isValid).toBe(true);
    expect(result.hasTiebreak).toBe(true);
    expect(result.winner).toBe('player1');
  });

  it('deve identificar 6x7 como set encerrado com tiebreak', () => {
    const result = validateSetResult({ p1Games: 6, p2Games: 7 }, 'BEST_OF_3');
    expect(result.isValid).toBe(true);
    expect(result.hasTiebreak).toBe(true);
    expect(result.winner).toBe('player2');
  });

  it('deve exigir tiebreak em 6x6', () => {
    const result = validateSetResult({ p1Games: 6, p2Games: 6 }, 'BEST_OF_3');
    expect(result.isValid).toBe(false);
    expect(result.tiebreakRequired).toBe(true);
  });

  it('deve rejeitar 8x6 (máximo 7x6)', () => {
    const result = validateSetResult({ p1Games: 8, p2Games: 6 }, 'BEST_OF_3');
    expect(result.isValid).toBe(false);
    expect(result.error).toMatch(/Máximo|Maximum/);
  });

  it('deve rejeitar 6x8', () => {
    const result = validateSetResult({ p1Games: 6, p2Games: 8 }, 'BEST_OF_3');
    expect(result.isValid).toBe(false);
  });

  it('deve aceitar 7-5 (win by 2)', () => {
    const result = validateSetResult({ p1Games: 7, p2Games: 5 }, 'BEST_OF_3');
    expect(result.isValid).toBe(true);
    expect(result.winner).toBe('player1');
  });
});

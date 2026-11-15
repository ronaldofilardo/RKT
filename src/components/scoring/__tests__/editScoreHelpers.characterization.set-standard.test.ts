/**
 * CHARACTERIZATION — editScoreHelpers (validateSetResult standard, parte 1:
 * set parcial x set encerrado). Divisão da suíte original
 * editScoreHelpers.characterization.test.ts (513L); doc: editScoreHelpersTestKit.ts.
 */
import { validateSetResult } from '@/core/scoring/edit-score-domain';

describe('editScoreHelpers (characterization) — validateSetResult (standard: parcial/encerrado)', () => {
  it('deve identificar 6x5 como set parcial (não encerrado)', () => {
    const result = validateSetResult({ p1Games: 6, p2Games: 5 }, 'BEST_OF_3');
    expect(result.isValid).toBe(true);
    expect(result.isPartial).toBe(true);
    expect(result.winner).toBeUndefined();
  });

  it('deve identificar 5x6 como set parcial', () => {
    const result = validateSetResult({ p1Games: 5, p2Games: 6 }, 'BEST_OF_3');
    expect(result.isValid).toBe(true);
    expect(result.isPartial).toBe(true);
  });

  it('deve identificar 6x4 como set encerrado', () => {
    const result = validateSetResult({ p1Games: 6, p2Games: 4 }, 'BEST_OF_3');
    expect(result.isValid).toBe(true);
    expect(result.isPartial).toBeUndefined();
    expect(result.winner).toBe('player1');
  });

  it('deve identificar 4x6 como set encerrado', () => {
    const result = validateSetResult({ p1Games: 4, p2Games: 6 }, 'BEST_OF_3');
    expect(result.isValid).toBe(true);
    expect(result.winner).toBe('player2');
  });

  it('deve identificar 7x5 como set encerrado (win by 2)', () => {
    const result = validateSetResult({ p1Games: 7, p2Games: 5 }, 'BEST_OF_3');
    expect(result.isValid).toBe(true);
    expect(result.winner).toBe('player1');
    expect(result.hasTiebreak).toBe(true);
  });

  it('deve identificar 5x7 como set encerrado', () => {
    const result = validateSetResult({ p1Games: 5, p2Games: 7 }, 'BEST_OF_3');
    expect(result.isValid).toBe(true);
    expect(result.winner).toBe('player2');
    expect(result.hasTiebreak).toBe(true);
  });
});

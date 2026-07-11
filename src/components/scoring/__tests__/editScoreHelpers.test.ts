import { validateSetResult } from '@/components/scoring/editScoreHelpers';

describe('validateSetResult - Bug 6x5 fix', () => {
  it('deve identificar 6x5 como set parcial (não encerrado)', () => {
    const result = validateSetResult({ p1Games: 6, p2Games: 5 }, 'BEST_OF_3');
    
    expect(result.isValid).toBe(true);
    expect(result.isPartial).toBe(true);
    expect(result.winner).toBeUndefined();
  });

  it('deve identificar 5x6 como set parcial (não encerrado)', () => {
    const result = validateSetResult({ p1Games: 5, p2Games: 6 }, 'BEST_OF_3');
    
    expect(result.isValid).toBe(true);
    expect(result.isPartial).toBe(true);
    expect(result.winner).toBeUndefined();
  });

  it('deve identificar 6x4 como set encerrado (player1 vence)', () => {
    const result = validateSetResult({ p1Games: 6, p2Games: 4 }, 'BEST_OF_3');
    
    expect(result.isValid).toBe(true);
    expect(result.isPartial).toBeUndefined();
    expect(result.winner).toBe('player1');
  });

  it('deve identificar 4x6 como set encerrado (player2 vence)', () => {
    const result = validateSetResult({ p1Games: 4, p2Games: 6 }, 'BEST_OF_3');
    
    expect(result.isValid).toBe(true);
    expect(result.isPartial).toBeUndefined();
    expect(result.winner).toBe('player2');
  });

  it('deve identificar 7x5 como set encerrado (player1 vence por 2 games)', () => {
    const result = validateSetResult({ p1Games: 7, p2Games: 5 }, 'BEST_OF_3');
    
    expect(result.isValid).toBe(true);
    expect(result.isPartial).toBeUndefined();
    expect(result.winner).toBe('player1');
  });

  it('deve identificar 5x7 como set encerrado (player2 vence por 2 games)', () => {
    const result = validateSetResult({ p1Games: 5, p2Games: 7 }, 'BEST_OF_3');
    
    expect(result.isValid).toBe(true);
    expect(result.isPartial).toBeUndefined();
    expect(result.winner).toBe('player2');
  });

  it('deve identificar 7x6 como set encerrado com tiebreak (player1 vence)', () => {
    const result = validateSetResult({ p1Games: 7, p2Games: 6 }, 'BEST_OF_3');
    
    expect(result.isValid).toBe(true);
    expect(result.hasTiebreak).toBe(true);
    expect(result.winner).toBe('player1');
  });

  it('deve identificar 6x7 como set encerrado com tiebreak (player2 vence)', () => {
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

  it('deve rejeitar placar 8x6 como inválido (máximo é 7x6)', () => {
    const result = validateSetResult({ p1Games: 8, p2Games: 6 }, 'BEST_OF_3');
    
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Maximum');
  });

  it('deve rejeitar placar 6x8 como inválido (máximo é 7x6)', () => {
    const result = validateSetResult({ p1Games: 6, p2Games: 8 }, 'BEST_OF_3');
    
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Maximum');
  });

  it('deve rejeitar placar 9x6 como inválido (máximo é 7x6)', () => {
    const result = validateSetResult({ p1Games: 9, p2Games: 6 }, 'BEST_OF_3');
    
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Maximum');
  });
});
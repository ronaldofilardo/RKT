import { validateSetResult, isTiebreakScoreImpossible } from '@/components/scoring/editScoreHelpers';

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

describe('isTiebreakScoreImpossible', () => {
  it('deve retornar false para 0x0 (início)', () => {
    expect(isTiebreakScoreImpossible(0, 0)).toBe(false);
  });

  it('deve retornar false para 7x5 (válido)', () => {
    expect(isTiebreakScoreImpossible(7, 5)).toBe(false);
  });

  it('deve retornar false para 5x7 (válido)', () => {
    expect(isTiebreakScoreImpossible(5, 7)).toBe(false);
  });

  it('deve retornar false para 7x0 (válido)', () => {
    expect(isTiebreakScoreImpossible(7, 0)).toBe(false);
  });

  it('deve retornar false para 8x6 (válido)', () => {
    expect(isTiebreakScoreImpossible(8, 6)).toBe(false);
  });

  it('deve retornar false para 9x7 (válido)', () => {
    expect(isTiebreakScoreImpossible(9, 7)).toBe(false);
  });

  it('deve retornar false para 7x7 (empate/incompleto)', () => {
    expect(isTiebreakScoreImpossible(7, 7)).toBe(false);
  });

  it('deve retornar true para 8x5 (impossível — set teria terminado em 7x5)', () => {
    expect(isTiebreakScoreImpossible(8, 5)).toBe(true);
  });

  it('deve retornar true para 5x8 (impossível)', () => {
    expect(isTiebreakScoreImpossible(5, 8)).toBe(true);
  });

  it('deve retornar true para 7x10 (impossível — set teria terminado antes)', () => {
    expect(isTiebreakScoreImpossible(7, 10)).toBe(true);
  });

  it('deve retornar true para 13x8 (impossível — set teria terminado antes)', () => {
    expect(isTiebreakScoreImpossible(13, 8)).toBe(true);
  });

  it('deve retornar true para 10x7 (impossível — set teria terminado em 9x7)', () => {
    expect(isTiebreakScoreImpossible(10, 7)).toBe(true);
  });

  it('deve retornar false para 7x6 (incompleto — diferença de 1)', () => {
    expect(isTiebreakScoreImpossible(7, 6)).toBe(false);
  });

  it('deve retornar false para 6x7 (incompleto — diferença de 1)', () => {
    expect(isTiebreakScoreImpossible(6, 7)).toBe(false);
  });
});
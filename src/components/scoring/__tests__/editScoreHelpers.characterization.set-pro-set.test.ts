/**
 * CHARACTERIZATION — editScoreHelpers (validateSetResult PRO_SET_8).
 * Divisão da suíte original editScoreHelpers.characterization.test.ts (513L);
 * cabeçalho completo (TD-046) e builders: editScoreHelpersTestKit.ts.
 */
import { validateSetResult } from '@/core/scoring/edit-score-domain';

describe('editScoreHelpers (characterization) — validateSetResult (PRO_SET_8)', () => {
  it('deve validar set completo 8-6 sem tiebreak', () => {
    const result = validateSetResult({ p1Games: 8, p2Games: 6 }, 'PRO_SET_8');
    expect(result.isValid).toBe(true);
    expect(result.winner).toBe('player1');
    expect(result.hasTiebreak).toBe(false);
  });

  it('deve validar set completo 8-0 (walkover)', () => {
    const result = validateSetResult({ p1Games: 8, p2Games: 0 }, 'PRO_SET_8');
    expect(result.isValid).toBe(true);
    expect(result.winner).toBe('player1');
  });

  it('deve tratar 9-8 como set em andamento (tiebreak só em 9-9)', () => {
    // Regra atual: tiebreak do PRO_SET_8 começa em 9-9, então 9-8 é
    // placar parcial em andamento (sem vencedor/tiebreak).
    const result = validateSetResult({ p1Games: 9, p2Games: 8 }, 'PRO_SET_8');
    expect(result.isValid).toBe(true);
    expect(result.isPartial).toBe(true);
    expect(result.winner).toBeUndefined();
  });

  it('deve requerer tiebreak em 9-9', () => {
    const result = validateSetResult({ p1Games: 9, p2Games: 9 }, 'PRO_SET_8');
    expect(result.isValid).toBe(false);
    expect(result.tiebreakRequired).toBe(true);
  });

  it('deve retornar isPartial=true para 8-8', () => {
    const result = validateSetResult({ p1Games: 8, p2Games: 8 }, 'PRO_SET_8');
    expect(result.isValid).toBe(true);
    expect(result.isPartial).toBe(true);
  });

  it('deve retornar isPartial=true para 7-6', () => {
    const result = validateSetResult({ p1Games: 7, p2Games: 6 }, 'PRO_SET_8');
    expect(result.isValid).toBe(true);
    expect(result.isPartial).toBe(true);
  });

  it('deve rejeitar 10-8 (10º game só existe saindo do tiebreak 9-9)', () => {
    const result = validateSetResult({ p1Games: 10, p2Games: 8 }, 'PRO_SET_8');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('not possible');
  });

  it('deve aceitar 8-5 como set válido completo (8 games, margem 3)', () => {
    // Comportamento observado: 8-5 é set completo válido (winner=player1)
    const result = validateSetResult({ p1Games: 8, p2Games: 5 }, 'PRO_SET_8');
    expect(result.isValid).toBe(true);
    expect(result.winner).toBe('player1');
    expect(result.hasTiebreak).toBe(false);
  });
});

/**
 * CHARACTERIZATION — edit-score-state (validateSetResult: PRO_SET_8).
 * Divisão de edit-score-state.test.ts (645L/63 its); fixtures: editScoreStateTestKit.ts.
 */
import { validateSetResult } from '@/core/scoring/edit-score-domain';

describe('edit-score-state - isMatchTiebreakSet', () => {
  describe('validateSetResult com formatos especiais', () => {
    describe('PRO_SET_8', () => {
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

      it('deve retornar isPartial=true para 9-8 em PRO_SET_8 (margem insuficiente)', () => {
        const result = validateSetResult({ p1Games: 9, p2Games: 8 }, 'PRO_SET_8');

        expect(result.isValid).toBe(true);
        expect(result.isPartial).toBe(true);
      });

      it('deve requerer tiebreak em 9-9', () => {
        const result = validateSetResult({ p1Games: 9, p2Games: 9 }, 'PRO_SET_8');

        expect(result.isValid).toBe(false);
        expect(result.tiebreakRequired).toBe(true);
        expect(result.error).toContain('Tiebreak');
      });

      it('deve retornar isPartial=true para 8-8 em PRO_SET_8', () => {
        const result = validateSetResult({ p1Games: 8, p2Games: 8 }, 'PRO_SET_8');

        expect(result.isValid).toBe(true);
        expect(result.isPartial).toBe(true);
      });

      it('deve retornar isPartial=true para 7-6 em PRO_SET_8', () => {
        const result = validateSetResult({ p1Games: 7, p2Games: 6 }, 'PRO_SET_8');

        expect(result.isValid).toBe(true);
        expect(result.isPartial).toBe(true);
      });

      it('deve rejeitar 10-8 em PRO_SET_8 (10º game só sai do tiebreak em 9-9, terminando 10-9)', () => {
        // Item 5 do plano Ajustar Placar: mesma regra do 7-x — o vencedor com
        // tiebreakAt+1 games só é válido se o perdedor tem tiebreakAt games.
        const result = validateSetResult({ p1Games: 10, p2Games: 8 }, 'PRO_SET_8');

        expect(result.isValid).toBe(false);
        expect(result.error).toContain('not possible');
      });

      it('deve validar 10-9 em PRO_SET_8 (set decidido no tiebreak em 9-9)', () => {
        const result = validateSetResult({ p1Games: 10, p2Games: 9 }, 'PRO_SET_8');

        expect(result.isValid).toBe(true);
        expect(result.winner).toBe('player1');
        expect(result.tiebreakRequired).toBe(true);
      });
    });
  });
});

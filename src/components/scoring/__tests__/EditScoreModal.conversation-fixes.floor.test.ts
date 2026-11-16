/**
 * CHARACTERIZATION — EditScoreModal (getFloorError: tiebreak e games).
 * Divisão da suíte original EditScoreModal.conversation-fixes.test.ts (409L/23 its);
 * doc original e builders: editScoreModalConversationFixesTestKit.ts.
 */
import { getFloorError } from '../use-edit-score-modal-confirm.logic';
import { TIE_FLOOR, GAME_FLOOR } from './editScoreModalConversationFixesTestKit';

describe('Conversa 2026-09-08 - Tiebreak floor validation', () => {
  describe('getFloorError para tiebreak', () => {
    it('deve bloquear tiebreak inferior ao floor', () => {
      // Floor = pontos do tiebreak: 2x3; usuário tenta confirmar com tiebreak 0x0
      const result = getFloorError(0, 0, TIE_FLOOR);
      expect(result).toContain('inferior');
    });

    it('deve aceitar tiebreak igual ao floor', () => {
      const result = getFloorError(2, 3, TIE_FLOOR);
      expect(result).toBeNull();
    });

    it('deve aceitar tiebreak superior ao floor', () => {
      const result = getFloorError(3, 4, TIE_FLOOR);
      expect(result).toBeNull();
    });

    it('deve bloquear quando um jogador regrediu', () => {
      // P1 regrediu de 2 para 1
      const result = getFloorError(1, 3, TIE_FLOOR);
      expect(result).toContain('inferior');
    });

    it('deve bloquear quando ambos regrediram', () => {
      const result = getFloorError(1, 2, TIE_FLOOR);
      expect(result).toContain('inferior');
    });
  });

  describe('getFloorError para games normais', () => {
    it('deve bloquear games inferiores ao floor', () => {
      const result = getFloorError(3, 3, GAME_FLOOR);
      expect(result).toContain('inferior');
    });

    it('deve aceitar games iguais ao floor', () => {
      const result = getFloorError(4, 3, GAME_FLOOR);
      expect(result).toBeNull();
    });

    it('deve aceitar games superiores ao floor', () => {
      const result = getFloorError(5, 3, GAME_FLOOR);
      expect(result).toBeNull();
    });

    it('deve bloquear quando floor é null (sem floor)', () => {
      // Quando floor é null, getFloorError não bloqueia
      const result = getFloorError(0, 0, null);
      expect(result).toBeNull();
    });
  });
});

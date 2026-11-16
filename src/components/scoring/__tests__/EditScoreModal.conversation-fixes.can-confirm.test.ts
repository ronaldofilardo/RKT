/**
 * CHARACTERIZATION — EditScoreModal (canConfirm resume logic).
 * Divisão da suíte original EditScoreModal.conversation-fixes.test.ts (409L/23 its);
 * doc original e builders: editScoreModalConversationFixesTestKit.ts.
 */
import { resumeArrange } from './editScoreModalConversationFixesTestKit';

describe('Conversa 2026-09-08 - canConfirm resume logic', () => {
  describe('deve permitir confirmar ao retomar partida abandonada', () => {
    it('0x0 com game points existentes (30-30) deve ter canConfirm=true', () => {
      // Simula o cenário: partida abandonada no set 1, 0x0, 30-30
      // O modal abre preenchido com 0x0 e game points 30-30
      // canConfirm deve ser true para permitir retomar
      const { state, completedSets, bothFilled, scoresAreZero, hasGamePoints } =
        resumeArrange('30', '30');

      // Condição de canConfirm para retomada
      const canConfirmResume = (!bothFilled || scoresAreZero) &&
        (completedSets.length > 0 || state.newSets.length > 0 || hasGamePoints);

      expect(bothFilled).toBe(true);
      expect(scoresAreZero).toBe(true);
      expect(hasGamePoints).toBe(true);
      expect(canConfirmResume).toBe(true);
    });

    it('0x0 sem game points (0-0) e sem completedSets deve ter canConfirm=false', () => {
      const { state, completedSets, bothFilled, scoresAreZero, hasGamePoints } =
        resumeArrange('0', '0');

      const canConfirmResume = (!bothFilled || scoresAreZero) &&
        (completedSets.length > 0 || state.newSets.length > 0 || hasGamePoints);

      expect(hasGamePoints).toBe(false);
      expect(canConfirmResume).toBe(false);
    });

    it('0x0 com completedSets existentes deve ter canConfirm=true', () => {
      const { state, completedSets, bothFilled, scoresAreZero } =
        resumeArrange('0', '0', [{ games: { player1: 6, player2: 4 } }]);

      const canConfirmResume = (!bothFilled || scoresAreZero) &&
        (completedSets.length > 0 || state.newSets.length > 0);

      expect(completedSets.length).toBeGreaterThan(0);
      expect(canConfirmResume).toBe(true);
    });
  });
});

/**
 * CHARACTERIZATION — EditScoreModal (Tiebreak initialGameRef).
 * Divisão da suíte original EditScoreModal.conversation-fixes.test.ts (409L/23 its);
 * doc original e builders: editScoreModalConversationFixesTestKit.ts.
 */
import { initialGameRefFrom } from './editScoreModalConversationFixesTestKit';

describe('Conversa 2026-09-08 - Tiebreak initialGameRef', () => {
  it('initialGameRef deve ser setado para tiebreak com pontos 2-3', () => {
    // Simula a inicialização do modal quando isTiebreak=true
    const ref = initialGameRefFrom({ player1: 2, player2: 3 });

    expect(ref).not.toBeNull();
    expect(ref!.player1).toBe('2');
    expect(ref!.player2).toBe('3');
  });

  it('initialGameRef deve ser setado para set normal com game points 30-15', () => {
    const ref = initialGameRefFrom({ player1: '30', player2: '15' });

    expect(ref).not.toBeNull();
    expect(ref!.player1).toBe('30');
    expect(ref!.player2).toBe('15');
  });
});

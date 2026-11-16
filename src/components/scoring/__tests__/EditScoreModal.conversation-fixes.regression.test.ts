/**
 * CHARACTERIZATION — EditScoreModal (Tiebreak regression check).
 * Divisão da suíte original EditScoreModal.conversation-fixes.test.ts (409L/23 its);
 * doc original e builders: editScoreModalConversationFixesTestKit.ts.
 */
import { tiebreakRegression } from './editScoreModalConversationFixesTestKit';

describe('Conversa 2026-09-08 - Tiebreak regression check', () => {
  it('deve bloquear tiebreak que regrediu de 2-3 para 0-0', () => {
    const { sameSetScore, isRegression } = tiebreakRegression(
      { player1: '2', player2: '3' }, '0', '0',
    );

    expect(sameSetScore).toBe(true);
    expect(isRegression).toBe(true);
  });

  it('deve aceitar tiebreak que avançou de 2-3 para 3-4', () => {
    const { isRegression } = tiebreakRegression(
      { player1: '2', player2: '3' }, '3', '4',
    );

    expect(isRegression).toBe(false);
  });

  it('deve aceitar tiebreak que manteve 2-3', () => {
    const { isRegression } = tiebreakRegression(
      { player1: '2', player2: '3' }, '2', '3',
    );

    expect(isRegression).toBe(false);
  });
});

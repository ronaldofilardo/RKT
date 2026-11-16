/**
 * CHARACTERIZATION — EditScoreModal (currentGamePoints tiebreak fix).
 * Divisão da suíte original EditScoreModal.conversation-fixes.test.ts (409L/23 its);
 * doc original e builders: editScoreModalConversationFixesTestKit.ts.
 */
import { gamePointsFrom } from './editScoreModalConversationFixesTestKit';

describe('Conversa 2026-09-08 - currentGamePoints tiebreak fix', () => {
  it('deve usar tiebreakScore em vez de currentGame quando isTiebreak=true', () => {
    // Simula o bug: currentGame é sempre 0-0 durante tiebreak
    const effectiveScoreState = {
      currentGame: { player1: 0, player2: 0 }, // Sempre 0 durante tiebreak
      sets: [{
        player1: 6,
        player2: 6,
        isTiebreak: true,
        tiebreakScore: { player1: 2, player2: 3 },
      }],
    };

    // Fix: usar tiebreakScore quando isTiebreak
    const currentGamePoints = gamePointsFrom(effectiveScoreState, true);

    expect(currentGamePoints.player1).toBe(2);
    expect(currentGamePoints.player2).toBe(3);
  });

  it('deve usar currentGame quando isTiebreak=false', () => {
    const effectiveScoreState = {
      currentGame: { player1: 1, player2: 3 },
      sets: [{
        player1: 4,
        player2: 3,
        isTiebreak: false,
        tiebreakScore: undefined,
      }],
    };

    const currentGamePoints = gamePointsFrom(effectiveScoreState, false);

    expect(currentGamePoints.player1).toBe(1);
    expect(currentGamePoints.player2).toBe(3);
  });
});

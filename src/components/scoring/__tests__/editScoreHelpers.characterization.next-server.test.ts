/**
 * CHARACTERIZATION — editScoreHelpers (getNextServerAfterSet: alternância).
 * Divisão da suíte original editScoreHelpers.characterization.test.ts (513L);
 * cabeçalho completo (TD-046) e builders: editScoreHelpersTestKit.ts.
 */
import { nextServer } from './editScoreHelpersTestKit';

describe('editScoreHelpers (characterization) — getNextServerAfterSet', () => {
  it('deve alternar server em set normal (total games par)', () => {
    // 6+4=10 games (par) -> mesmo server
    expect(nextServer({ p1Games: 6, p2Games: 4 })).toBe('player1');
  });

  it('deve alternar server em set normal (total games ímpar)', () => {
    // 6+3=9 games (ímpar) -> outro server
    expect(nextServer({ p1Games: 6, p2Games: 3 })).toBe('player2');
  });

  it("BUG FIX (2026-09-22): deve TROCAR server em tiebreak win (não-MT) — regra ITF", () => {
    // 7-6 = 13 games (ímpar) → servidor troca (quem sacou o 1º ponto do
    // tiebreak passa a RECEBER no set seguinte).
    expect(nextServer({ p1Games: 7, p2Games: 6, tiebreakPoints: { player1: 7, player2: 5 } })).toBe('player2');
  });

  describe('completedSets contribution', () => {
    it('deve somar games de completedSets para alternância', () => {
      // completedSets: 6+4 + 3+6 = 19 games
      // current set: 6+4 = 10 games
      // total = 29 (ímpar) -> alternar
      expect(
        nextServer({ completedSets: [{ player1: 6, player2: 4 }, { player1: 3, player2: 6 }] }),
      ).toBe('player2');
    });
  });

  it('deve funcionar com currentServer = player2', () => {
    expect(nextServer({ currentServer: 'player2', p1Games: 6, p2Games: 3 })).toBe('player1');
    expect(nextServer({ currentServer: 'player2', p1Games: 6, p2Games: 4 })).toBe('player2');
  });
});

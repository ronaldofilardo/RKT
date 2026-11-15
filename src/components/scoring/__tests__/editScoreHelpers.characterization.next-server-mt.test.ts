/**
 * CHARACTERIZATION — editScoreHelpers (getNextServerAfterSet: Match Tiebreak,
 * regra ITF e 5º set). Divisão da suíte original
 * editScoreHelpers.characterization.test.ts (513L); doc: editScoreHelpersTestKit.ts.
 */
import { nextServer } from './editScoreHelpersTestKit';

describe('editScoreHelpers (characterization) — getNextServerAfterSet (Match Tiebreak: ITF e 5º set)', () => {
  it('deve detectar MATCH_TB_10 como MT set', () => {
    const result = nextServer({
      format: 'MATCH_TB_10',
      p1Games: 10,
      p2Games: 8,
      tiebreakPoints: { player1: 10, player2: 8 },
    });
    // ITF: 1º saque saca 1 pt, depois alterna a cada 2 pts.
    // totalPoints = 18, turn = floor(19/2) = 9 (ímpar) -> player2
    expect(result).toBe('player2');
  });

  it('deve alternar server em MT a cada 2 pontos (totalPoints par)', () => {
    const result = nextServer({
      format: 'MATCH_TB_10',
      p1Games: 10,
      p2Games: 7,
      tiebreakPoints: { player1: 10, player2: 7 }, // total = 17 (ímpar)
    });
    // 17 pts jogados -> turn = floor(18/2) = 9 (ímpar) -> outro server
    expect(result).toBe('player2');
  });

  it('deve detectar BEST_OF_5 5º set com 2-2 como MT', () => {
    const result = nextServer({
      format: 'BEST_OF_5',
      p1Games: 6,
      p2Games: 6,
      completedSets: [
        { player1: 6, player2: 4 },
        { player1: 3, player2: 6 },
        { player1: 6, player2: 4 },
        { player1: 4, player2: 6 },
      ],
    });
    // MT: totalPoints = 6+6 = 12, turn = floor(13/2) = 6 (par) → player1
    expect(result).toBe('player1');
  });
});

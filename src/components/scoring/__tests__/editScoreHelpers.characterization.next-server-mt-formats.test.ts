/**
 * CHARACTERIZATION — editScoreHelpers (getNextServerAfterSet: Match Tiebreak,
 * 3º set por formato). Divisão da suíte original
 * editScoreHelpers.characterization.test.ts (513L); doc: editScoreHelpersTestKit.ts.
 */
import { nextServer } from './editScoreHelpersTestKit';

describe('editScoreHelpers (characterization) — getNextServerAfterSet (Match Tiebreak: 3º set)', () => {
  it('deve detectar BEST_OF_3_MATCH_TB 3º set com 1-1 como MT', () => {
    const result = nextServer({
      format: 'BEST_OF_3_MATCH_TB',
      p1Games: 10,
      p2Games: 8,
      completedSets: [
        { player1: 6, player2: 4 },
        { player1: 3, player2: 6 },
      ],
      tiebreakPoints: { player1: 10, player2: 8 },
    });
    expect(result).toBe('player2'); // total=18, turn=9 (ímpar)
  });

  it('deve detectar SHORT_SET_2V2_NO_AD 3º set com 1-1 como MT', () => {
    const result = nextServer({
      format: 'SHORT_SET_2V2_NO_AD',
      p1Games: 10,
      p2Games: 8,
      completedSets: [
        { player1: 4, player2: 2 },
        { player1: 2, player2: 4 },
      ],
      tiebreakPoints: { player1: 10, player2: 8 },
    });
    expect(result).toBe('player2');
  });

  it('deve detectar BEST_OF_3_NO_AD 3º set com 1-1 como MT', () => {
    const result = nextServer({
      format: 'BEST_OF_3_NO_AD',
      p1Games: 10,
      p2Games: 8,
      completedSets: [
        { player1: 6, player2: 4 },
        { player1: 3, player2: 6 },
      ],
      tiebreakPoints: { player1: 10, player2: 8 },
    });
    expect(result).toBe('player2');
  });
});

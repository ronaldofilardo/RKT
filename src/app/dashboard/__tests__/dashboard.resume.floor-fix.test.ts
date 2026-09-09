/**
 * @jest-environment jsdom
 */
/**
 * Regressão (2026-09-08): handleResumeSuspended calculava `floorSets` como
 * `null` sempre que o último set estava em tiebreak — mesmo quando era um
 * tiebreak comum de um set normal (6x6), perdendo o floor de games ao
 * retomar a sessão. Só o Match Tiebreak decisivo real deve resultar em
 * floorSets === null.
 */
import { useResumeSession } from "@/app/dashboard/dashboard.resume";

function buildOptions() {
  const setSession = jest.fn();
  const setPendingEdit = jest.fn();
  const router = { push: jest.fn() };
  const { handleResumeSuspended } = useResumeSession({ router, setSession, setPendingEdit });
  return { setSession, setPendingEdit, router, handleResumeSuspended };
}

describe("handleResumeSuspended — floor de retomada", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("BUG (2026-09-08): tiebreak comum de set em andamento (6x6) deve manter floor {6,6}, não null", () => {
    const { handleResumeSuspended, setPendingEdit } = buildOptions();

    const match = {
      id: "match-1",
      format: "BEST_OF_3",
      suspendedSessionId: "session-1",
      matchStateSnapshot: "snapshot",
      scoreState: {
        sets: [
          { player1: 6, player2: 3, isTiebreak: false, tiebreakScore: null },
          { player1: 6, player2: 6, isTiebreak: true, tiebreakScore: { player1: 2, player2: 1 } },
        ],
        currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null },
        setsWon: { player1: 1, player2: 0 },
      },
    };

    handleResumeSuspended(match);

    expect(setPendingEdit).toHaveBeenCalledTimes(1);
    const [, floorSets] = setPendingEdit.mock.calls[0];
    // Antes do fix: floorSets era `null` aqui (bug).
    expect(floorSets).toEqual({ player1: 6, player2: 6 });
  });

  it("Match Tiebreak decisivo real continua sem floor (null)", () => {
    const { handleResumeSuspended, setPendingEdit } = buildOptions();

    const match = {
      id: "match-2",
      format: "BEST_OF_3_MATCH_TB",
      suspendedSessionId: "session-2",
      matchStateSnapshot: "snapshot",
      scoreState: {
        sets: [
          { player1: 6, player2: 4, isTiebreak: false, tiebreakScore: null },
          { player1: 4, player2: 6, isTiebreak: false, tiebreakScore: null },
          { player1: 0, player2: 0, isTiebreak: true, tiebreakScore: { player1: 5, player2: 3 } },
        ],
        currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null },
        setsWon: { player1: 1, player2: 1 },
      },
    };

    handleResumeSuspended(match);

    const [, floorSets] = setPendingEdit.mock.calls[0];
    expect(floorSets).toBeNull();
  });

  it("set normal (sem tiebreak) em andamento mantém o comportamento anterior (floor = games atuais)", () => {
    const { handleResumeSuspended, setPendingEdit } = buildOptions();

    const match = {
      id: "match-3",
      format: "BEST_OF_3",
      suspendedSessionId: "session-3",
      matchStateSnapshot: "snapshot",
      scoreState: {
        sets: [{ player1: 3, player2: 2, isTiebreak: false, tiebreakScore: null }],
        currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null },
        setsWon: { player1: 0, player2: 0 },
      },
    };

    handleResumeSuspended(match);

    const [, floorSets] = setPendingEdit.mock.calls[0];
    expect(floorSets).toEqual({ player1: 3, player2: 2 });
  });
});

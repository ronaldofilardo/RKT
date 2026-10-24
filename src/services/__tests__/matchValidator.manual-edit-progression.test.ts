import { validateScoreProgression } from "../match-validator-progression.logic";

describe("validateScoreProgression - isManualScoreEdit (PR-3 Opção B)", () => {
  const oldScoreState = {
    sets: [
      { player1: 6, player2: 4, isTiebreak: false },
      { player1: 6, player2: 3, isTiebreak: false },
    ],
    setsWon: { player1: 2, player2: 0 },
    currentGame: { player1: 0, player2: 0 },
  };

  const regressedScoreState = {
    sets: [
      { player1: 6, player2: 4, isTiebreak: false },
      { player1: 3, player2: 6, isTiebreak: false },
    ],
    setsWon: { player1: 1, player2: 1 },
    currentGame: { player1: 0, player2: 0 },
  };

  it("deve rejeitar regressão de setsWon no fluxo padrão", () => {
    const result = validateScoreProgression(oldScoreState, regressedScoreState, false, false);
    expect(result).not.toBeNull();
    expect(result?.valid).toBe(false);
    expect(result?.error).toContain("SCORE_REGRESSION");
  });

  it("deve PERMITIR regressão de setsWon quando isManualScoreEdit for true", () => {
    const result = validateScoreProgression(oldScoreState, regressedScoreState, true, true);
    expect(result).toBeNull();
  });

  it("deve CONTINUAR bloqueando regressão de tie-break mesmo com isManualScoreEdit true", () => {
    const oldWithTb = {
      sets: [
        { player1: 6, player2: 6, isTiebreak: true, tiebreakScore: { player1: 7, player2: 5 } },
      ],
      setsWon: { player1: 0, player2: 0 },
    };
    const regressedTb = {
      sets: [
        { player1: 6, player2: 6, isTiebreak: true, tiebreakScore: { player1: 3, player2: 5 } },
      ],
      setsWon: { player1: 0, player2: 0 },
    };

    const result = validateScoreProgression(oldWithTb, regressedTb, true, true);
    expect(result).not.toBeNull();
    expect(result?.valid).toBe(false);
    expect(result?.error).toContain("Tie-break não pode regredir");
  });
});

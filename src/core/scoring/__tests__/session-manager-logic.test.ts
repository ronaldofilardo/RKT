import { ScoringEngine } from "@/core/scoring/engine";
import type { ScoringState } from "@/core/scoring/types";
import { setsToWinForFormat } from "@/components/scoring/editScoreHelpers";
import { pointToProgress } from "@/core/scoring/point-utils";

describe("useSessionManager - handleEditScore Logic", () => {
  const config = {
    format: "BEST_OF_3" as const,
    player1Id: "p1",
    player2Id: "p2",
    initialServerId: "p1",
  };

  it("should correctly determine match finished and winner when edit score completes the match", () => {
    const setResults = [
      { p1Games: 6, p2Games: 4, isPartial: false },
      { p1Games: 6, p2Games: 2, isPartial: false },
    ];
    const server = "player1" as const;

    const completedSetsProcessed = setResults.filter((set) => !set.isPartial);
    const p1Sets = completedSetsProcessed.filter((set) => set.p1Games > set.p2Games).length;
    const p2Sets = completedSetsProcessed.filter((set) => set.p2Games > set.p1Games).length;
    const setsWon = { player1: p1Sets, player2: p2Sets };

    const setsToWin = setsToWinForFormat(config.format);
    const winner = setsWon.player1 >= setsToWin ? "player1" : setsWon.player2 >= setsToWin ? "player2" : null;
    const isFinished = winner !== null;

    expect(setsWon).toEqual({ player1: 2, player2: 0 });
    expect(winner).toBe("player1");
    expect(isFinished).toBe(true);
  });

  it("should not mark match as finished if sets won is less than required", () => {
    const setResults = [
      { p1Games: 6, p2Games: 4, isPartial: false },
      { p1Games: 3, p2Games: 6, isPartial: false },
      { p1Games: 3, p2Games: 2, isPartial: true, currentGamePoints: { player1: 0, player2: 15 } },
    ];
    const server = "player1" as const;

    const completedSetsProcessed = setResults.filter((set) => !set.isPartial);
    const p1Sets = completedSetsProcessed.filter((set) => set.p1Games > set.p2Games).length;
    const p2Sets = completedSetsProcessed.filter((set) => set.p2Games > set.p1Games).length;
    const setsWon = { player1: p1Sets, player2: p2Sets };

    const setsToWin = setsToWinForFormat(config.format);
    const winner = setsWon.player1 >= setsToWin ? "player1" : setsWon.player2 >= setsToWin ? "player2" : null;
    const isFinished = winner !== null;

    expect(setsWon).toEqual({ player1: 1, player2: 1 });
    expect(winner).toBe(null);
    expect(isFinished).toBe(false);
  });

  it("should correctly parse game points for the engine state", () => {
    expect(pointToProgress("0")).toBe(0);
    expect(pointToProgress("15")).toBe(1);
    expect(pointToProgress("30")).toBe(2);
    expect(pointToProgress("40")).toBe(3);
    expect(pointToProgress("DEUCE")).toBe(3);
    expect(pointToProgress("AD")).toBe(4);
    expect(pointToProgress(0)).toBe(0);
    expect(pointToProgress(40)).toBe(3);
  });
});

import { ScoringEngine } from "@/core/scoring/engine";
import type { ScoringState } from "@/core/scoring/types";
import { setsToWinForFormat } from "@/components/scoring/editScoreHelpers";

describe("useSessionManager - handleEditScore Logic", () => {
  const config = {
    format: "BEST_OF_3" as const,
    player1Id: "p1",
    player2Id: "p2",
    initialServerId: "p1",
  };

  const parseP = (v: number | string): number => {
    if (typeof v === "string") {
      if (v === "AD") return 4;
      if (v === "DEUCE") return 3;
      const n = parseInt(v, 10);
      if (n === 40) return 3;
      if (n === 30) return 2;
      if (n === 15) return 1;
      return 0;
    }
    if (v === 40) return 3;
    if (v === 30) return 2;
    if (v === 15) return 1;
    return v;
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
    expect(parseP("0")).toBe(0);
    expect(parseP("15")).toBe(1);
    expect(parseP("30")).toBe(2);
    expect(parseP("40")).toBe(3);
    expect(parseP("DEUCE")).toBe(3);
    expect(parseP("AD")).toBe(4);
    expect(parseP(0)).toBe(0);
    expect(parseP(40)).toBe(3);
  });
});

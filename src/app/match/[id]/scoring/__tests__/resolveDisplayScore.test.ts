import { resolveDisplayScore } from "../resolveDisplayScore";
import type { ScoringState } from "@/core/scoring/types";

function buildScore(overrides: Partial<ScoringState> = {}): ScoringState {
  return {
    sets: [{ player1: 3, player2: 2, isTiebreak: false } as any],
    currentGame: { player1: 0, player2: 0 } as any,
    server: "player1",
    isFinished: false,
    winner: null,
    setsWon: { player1: 0, player2: 0 },
    startedAt: Date.now(),
    secondServe: false,
    ...overrides,
  };
}

describe("resolveDisplayScore", () => {
  describe("modal closed (activeModal !== 'edit-score')", () => {
    it("returns scoreState when no suspended session", () => {
      const score = buildScore();
      expect(resolveDisplayScore(null, score, null, null)).toBe(score);
    });

    it("returns scoreState even if pendingEditScore is present", () => {
      const score = buildScore();
      const stale = buildScore({ sets: [{ player1: 1, player2: 0, isTiebreak: false } as any] });
      expect(resolveDisplayScore(null, score, { scoreState: stale, floorSets: null }, null)).toBe(score);
    });

    it("falls back to suspendedSession.bankScoreState when scoreState is null", () => {
      const bank = buildScore();
      expect(resolveDisplayScore(null, null, null, { bankScoreState: bank })).toBe(bank);
    });

    it("returns null when everything is null", () => {
      expect(resolveDisplayScore(null, null, null, null)).toBeNull();
    });
  });

  describe("modal open (activeModal === 'edit-score')", () => {
    it("prefers pendingEditScore.scoreState", () => {
      const current = buildScore();
      const pending = buildScore({ sets: [{ player1: 5, player2: 4, isTiebreak: false } as any] });
      expect(
        resolveDisplayScore("edit-score", current, { scoreState: pending, floorSets: null }, null),
      ).toBe(pending);
    });

    it("falls back to scoreState when pendingEditScore is null", () => {
      const score = buildScore();
      expect(resolveDisplayScore("edit-score", score, null, null)).toBe(score);
    });

    it("falls back to suspendedSession.bankScoreState when scoreState and pending are null", () => {
      const bank = buildScore();
      expect(resolveDisplayScore("edit-score", null, null, { bankScoreState: bank })).toBe(bank);
    });

    it("returns null when all inputs are null", () => {
      expect(resolveDisplayScore("edit-score", null, null, null)).toBeNull();
    });
  });

  describe("regression: stale pendingEditScore does not mask fresh scoreState after modal closes", () => {
    it("returns fresh scoreState when modal is closed, ignoring stale pendingEditScore", () => {
      const fresh = buildScore({ sets: [{ player1: 6, player2: 4, isTiebreak: false } as any] });
      const stale = buildScore({ sets: [{ player1: 3, player2: 2, isTiebreak: false } as any] });

      const result = resolveDisplayScore(null, fresh, { scoreState: stale, floorSets: null }, null);
      expect(result).toBe(fresh);
      expect(result?.sets[0].player1).toBe(6);
    });
  });
});

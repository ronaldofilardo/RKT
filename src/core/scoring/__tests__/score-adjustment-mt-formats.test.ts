/**
 * Integration tests for Score Adjustment with Match Tie-Break across all formats
 * Covers: BEST_OF_3, BEST_OF_3_MATCH_TB, BEST_OF_5, SHORT_SET_2V2_NO_AD, MATCH_TB_10, PRO_SET_8
 */

import { ScoringEngine } from "@/core/scoring/engine";
import type { ScoringState, SetScore } from "@/core/scoring/types";
import {
  isMatchTiebreakSet,
  calculateSetsWon,
  validateMatchTiebreakComplete,
} from "@/hooks/useSessionManager.utils";
import { isMatchTiebreakActive } from "@/lib/matchConfig";
import { buildNewScoringState } from "@/hooks/useSessionManager.state-builder";
import type { SetEditData } from "@/components/scoring/editScoreHelpers";

function makeConfig(format: string) {
  return {
    format: format as any,
    player1Id: "p1",
    player2Id: "p2",
    initialServerId: "p1",
  };
}

describe("Match Tie-Break Integration - All Formats", () => {
  // ─── BEST_OF_3_MATCH_TB ───────────────────────────────────────
  describe("BEST_OF_3_MATCH_TB", () => {
    it("isMatchTiebreakSet: set 3 (index 2) should be MT when 1x1", () => {
      const setResults: SetEditData[] = [
        { p1Games: 6, p2Games: 4, isPartial: false },
        { p1Games: 3, p2Games: 6, isPartial: false },
      ];
      expect(isMatchTiebreakSet(2, setResults, "BEST_OF_3_MATCH_TB")).toBe(true);
    });

    it("isMatchTiebreakSet: set 1 (index 0) should NOT be MT", () => {
      const setResults: SetEditData[] = [
        { p1Games: 3, p2Games: 2, isPartial: true },
      ];
      expect(isMatchTiebreakSet(0, setResults, "BEST_OF_3_MATCH_TB")).toBe(false);
    });

    it("isMatchTiebreakActive: set 3 when 1x1", () => {
      expect(isMatchTiebreakActive("BEST_OF_3_MATCH_TB", 3, 1, 1)).toBe(true);
    });

    it("isMatchTiebreakActive: set 1 when 0x0", () => {
      expect(isMatchTiebreakActive("BEST_OF_3_MATCH_TB", 1, 0, 0)).toBe(false);
    });

    it("buildNewScoringState: should create MT for set 3", () => {
      const setResults: SetEditData[] = [
        { p1Games: 6, p2Games: 4, isPartial: false },
        { p1Games: 3, p2Games: 6, isPartial: false },
        { p1Games: 10, p2Games: 7, isPartial: false },
      ];
      const state = buildNewScoringState({
        setResults,
        server: "player1",
        format: "BEST_OF_3_MATCH_TB",
      });
      expect(state.isFinished).toBe(true);
      expect(state.winner).toBe("player1");
      expect(state.setsWon).toEqual({ player1: 2, player2: 1 });
    });

    it("buildNewScoringState: should allow partial MT score", () => {
      const setResults: SetEditData[] = [
        { p1Games: 6, p2Games: 4, isPartial: false },
        { p1Games: 3, p2Games: 6, isPartial: false },
        { p1Games: 8, p2Games: 7, isPartial: true },
      ];
      const state = buildNewScoringState({
        setResults,
        server: "player2",
        format: "BEST_OF_3_MATCH_TB",
      });
      expect(state.isFinished).toBe(false);
      expect(state.winner).toBeNull();
      expect(state.setsWon).toEqual({ player1: 1, player2: 1 });
    });

    it("validateMatchTiebreakComplete: valid MT (10x7)", () => {
      const setResults: SetEditData[] = [
        { p1Games: 6, p2Games: 4, isPartial: false },
        { p1Games: 3, p2Games: 6, isPartial: false },
        { p1Games: 10, p2Games: 7, isPartial: false },
      ];
      const result = validateMatchTiebreakComplete(setResults, "BEST_OF_3_MATCH_TB");
      expect(result.valid).toBe(true);
    });

    it("validateMatchTiebreakComplete: incomplete MT (8x7)", () => {
      const setResults: SetEditData[] = [
        { p1Games: 6, p2Games: 4, isPartial: false },
        { p1Games: 3, p2Games: 6, isPartial: false },
        { p1Games: 8, p2Games: 7, isPartial: true },
      ];
      const result = validateMatchTiebreakComplete(setResults, "BEST_OF_3_MATCH_TB");
      expect(result.valid).toBe(true); // partial is valid
    });

    it("calculateSetsWon: should count MT sets correctly", () => {
      const setResults: SetEditData[] = [
        { p1Games: 6, p2Games: 4, isPartial: false },
        { p1Games: 3, p2Games: 6, isPartial: false },
        { p1Games: 12, p2Games: 10, isPartial: false },
      ];
      const setsWon = calculateSetsWon(setResults, "BEST_OF_3_MATCH_TB");
      expect(setsWon).toEqual({ player1: 2, player2: 1 });
    });

    it("engine: full match with MT via loadState", () => {
      const state: ScoringState = {
        sets: [
          { player1: 6, player2: 4, isTiebreak: false, tiebreakScore: null },
          { player1: 3, player2: 6, isTiebreak: false, tiebreakScore: null },
          { player1: 0, player2: 0, isTiebreak: true, tiebreakScore: { player1: 11, player2: 9 } },
        ],
        currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
        server: "player1",
        isFinished: true,
        winner: "player1",
        setsWon: { player1: 2, player2: 1 },
        startedAt: Date.now(),
        secondServe: false,
      };

      const engine = new ScoringEngine(makeConfig("BEST_OF_3_MATCH_TB"), state);
      expect(engine.isFinished()).toBe(true);
      expect(engine.getState().winner).toBe("player1");
    });
  });

  // ─── BEST_OF_5 (Grand Slam) ──────────────────────────────────
  describe("BEST_OF_5", () => {
    it("isMatchTiebreakSet: set 5 (index 4) should be MT when 2x2", () => {
      const setResults: SetEditData[] = [
        { p1Games: 6, p2Games: 4, isPartial: false },
        { p1Games: 3, p2Games: 6, isPartial: false },
        { p1Games: 6, p2Games: 4, isPartial: false },
        { p1Games: 4, p2Games: 6, isPartial: false },
      ];
      expect(isMatchTiebreakSet(4, setResults, "BEST_OF_5")).toBe(true);
    });

    it("isMatchTiebreakSet: set 4 (index 3) should NOT be MT", () => {
      const setResults: SetEditData[] = [
        { p1Games: 6, p2Games: 4, isPartial: false },
        { p1Games: 3, p2Games: 6, isPartial: false },
        { p1Games: 6, p2Games: 4, isPartial: false },
        { p1Games: 4, p2Games: 5, isPartial: true },
      ];
      expect(isMatchTiebreakSet(3, setResults, "BEST_OF_5")).toBe(false);
    });

    it("isMatchTiebreakActive: set 5 when 2x2", () => {
      expect(isMatchTiebreakActive("BEST_OF_5", 5, 2, 2)).toBe(true);
    });

    it("isMatchTiebreakActive: set 4 when 1x2", () => {
      expect(isMatchTiebreakActive("BEST_OF_5", 4, 1, 2)).toBe(false);
    });

    it("isMatchTiebreakSet: set 4 (index 3) should NOT be MT when 3x0", () => {
      const setResults: SetEditData[] = [
        { p1Games: 6, p2Games: 4, isPartial: false },
        { p1Games: 6, p2Games: 3, isPartial: false },
        { p1Games: 6, p2Games: 2, isPartial: false },
        { p1Games: 3, p2Games: 3, isPartial: true },
      ];
      expect(isMatchTiebreakSet(3, setResults, "BEST_OF_5")).toBe(false);
    });

    it("buildNewScoringState: should create MT for set 5", () => {
      const setResults: SetEditData[] = [
        { p1Games: 6, p2Games: 4, isPartial: false },
        { p1Games: 3, p2Games: 6, isPartial: false },
        { p1Games: 6, p2Games: 4, isPartial: false },
        { p1Games: 4, p2Games: 6, isPartial: false },
        { p1Games: 12, p2Games: 10, isPartial: false },
      ];
      const state = buildNewScoringState({
        setResults,
        server: "player2",
        format: "BEST_OF_5",
      });
      expect(state.isFinished).toBe(true);
      expect(state.winner).toBe("player1");
      expect(state.setsWon).toEqual({ player1: 3, player2: 2 });
    });

    it("engine: full Grand Slam with MT in set 5", () => {
      const state: ScoringState = {
        sets: [
          { player1: 6, player2: 4, isTiebreak: false, tiebreakScore: null },
          { player1: 3, player2: 6, isTiebreak: false, tiebreakScore: null },
          { player1: 6, player2: 4, isTiebreak: false, tiebreakScore: null },
          { player1: 4, player2: 6, isTiebreak: false, tiebreakScore: null },
          { player1: 0, player2: 0, isTiebreak: true, tiebreakScore: { player1: 13, player2: 11 } },
        ],
        currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
        server: "player2",
        isFinished: true,
        winner: "player1",
        setsWon: { player1: 3, player2: 2 },
        startedAt: Date.now(),
        secondServe: false,
      };

      const engine = new ScoringEngine(makeConfig("BEST_OF_5"), state);
      expect(engine.isFinished()).toBe(true);
      expect(engine.getState().winner).toBe("player1");
    });

    it("validateMatchTiebreakComplete: valid MT in set 5", () => {
      const setResults: SetEditData[] = [
        { p1Games: 6, p2Games: 4, isPartial: false },
        { p1Games: 3, p2Games: 6, isPartial: false },
        { p1Games: 6, p2Games: 4, isPartial: false },
        { p1Games: 4, p2Games: 6, isPartial: false },
        { p1Games: 11, p2Games: 9, isPartial: false },
      ];
      const result = validateMatchTiebreakComplete(setResults, "BEST_OF_5");
      expect(result.valid).toBe(true);
    });
  });

  // ─── SHORT_SET_2V2_NO_AD ─────────────────────────────────────
  describe("SHORT_SET_2V2_NO_AD", () => {
    it("isMatchTiebreakSet: set 3 (index 2) should be MT when 1x1", () => {
      const setResults: SetEditData[] = [
        { p1Games: 4, p2Games: 2, isPartial: false },
        { p1Games: 2, p2Games: 4, isPartial: false },
      ];
      expect(isMatchTiebreakSet(2, setResults, "SHORT_SET_2V2_NO_AD")).toBe(true);
    });

    it("isMatchTiebreakActive: set 3 when 1x1", () => {
      expect(isMatchTiebreakActive("SHORT_SET_2V2_NO_AD", 3, 1, 1)).toBe(true);
    });

    it("isMatchTiebreakSet: set 1 (index 0) should NOT be MT", () => {
      const setResults: SetEditData[] = [
        { p1Games: 3, p2Games: 1, isPartial: true },
      ];
      expect(isMatchTiebreakSet(0, setResults, "SHORT_SET_2V2_NO_AD")).toBe(false);
    });

    it("buildNewScoringState: should create MT for set 3", () => {
      const setResults: SetEditData[] = [
        { p1Games: 4, p2Games: 2, isPartial: false },
        { p1Games: 2, p2Games: 4, isPartial: false },
        { p1Games: 10, p2Games: 6, isPartial: false },
      ];
      const state = buildNewScoringState({
        setResults,
        server: "player1",
        format: "SHORT_SET_2V2_NO_AD",
      });
      expect(state.isFinished).toBe(true);
      expect(state.winner).toBe("player1");
      expect(state.setsWon).toEqual({ player1: 2, player2: 1 });
    });

    it("validateMatchTiebreakComplete: valid MT", () => {
      const setResults: SetEditData[] = [
        { p1Games: 4, p2Games: 2, isPartial: false },
        { p1Games: 2, p2Games: 4, isPartial: false },
        { p1Games: 11, p2Games: 9, isPartial: false },
      ];
      const result = validateMatchTiebreakComplete(setResults, "SHORT_SET_2V2_NO_AD");
      expect(result.valid).toBe(true);
    });

    it("calculateSetsWon: should count MT sets correctly", () => {
      const setResults: SetEditData[] = [
        { p1Games: 4, p2Games: 2, isPartial: false },
        { p1Games: 1, p2Games: 4, isPartial: false },
        { p1Games: 10, p2Games: 8, isPartial: false },
      ];
      const setsWon = calculateSetsWon(setResults, "SHORT_SET_2V2_NO_AD");
      expect(setsWon).toEqual({ player1: 2, player2: 1 });
    });
  });

  // ─── MATCH_TB_10 ──────────────────────────────────────────────
  describe("MATCH_TB_10", () => {
    it("isMatchTiebreakSet: set 1 (index 0) should always be MT", () => {
      const setResults: SetEditData[] = [
        { p1Games: 8, p2Games: 7, isPartial: true },
      ];
      expect(isMatchTiebreakSet(0, setResults, "MATCH_TB_10")).toBe(true);
    });

    it("isMatchTiebreakActive: always true", () => {
      expect(isMatchTiebreakActive("MATCH_TB_10", 1, 0, 0)).toBe(true);
    });

    it("buildNewScoringState: should create MT for the only set", () => {
      const setResults: SetEditData[] = [
        { p1Games: 10, p2Games: 7, isPartial: false },
      ];
      const state = buildNewScoringState({
        setResults,
        server: "player1",
        format: "MATCH_TB_10",
      });
      expect(state.isFinished).toBe(true);
      expect(state.winner).toBe("player1");
      expect(state.setsWon).toEqual({ player1: 1, player2: 0 });
    });

    it("buildNewScoringState: partial MT score", () => {
      const setResults: SetEditData[] = [
        { p1Games: 8, p2Games: 7, isPartial: true },
      ];
      const state = buildNewScoringState({
        setResults,
        server: "player2",
        format: "MATCH_TB_10",
      });
      expect(state.isFinished).toBe(false);
      expect(state.winner).toBeNull();
    });

    it("validateMatchTiebreakComplete: valid MT", () => {
      const setResults: SetEditData[] = [
        { p1Games: 12, p2Games: 10, isPartial: false },
      ];
      const result = validateMatchTiebreakComplete(setResults, "MATCH_TB_10");
      expect(result.valid).toBe(true);
    });

    it("validateMatchTiebreakComplete: partial MT is valid", () => {
      const setResults: SetEditData[] = [
        { p1Games: 8, p2Games: 7, isPartial: true },
      ];
      const result = validateMatchTiebreakComplete(setResults, "MATCH_TB_10");
      expect(result.valid).toBe(true);
    });

    it("calculateSetsWon: should count MT sets correctly", () => {
      const setResults: SetEditData[] = [
        { p1Games: 10, p2Games: 8, isPartial: false },
      ];
      const setsWon = calculateSetsWon(setResults, "MATCH_TB_10");
      expect(setsWon).toEqual({ player1: 1, player2: 0 });
    });

    it("engine: full MT match via loadState", () => {
      const state: ScoringState = {
        sets: [
          { player1: 0, player2: 0, isTiebreak: true, tiebreakScore: { player1: 11, player2: 9 } },
        ],
        currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
        server: "player1",
        isFinished: true,
        winner: "player1",
        setsWon: { player1: 1, player2: 0 },
        startedAt: Date.now(),
        secondServe: false,
      };

      const engine = new ScoringEngine(makeConfig("MATCH_TB_10"), state);
      expect(engine.isFinished()).toBe(true);
      expect(engine.getState().winner).toBe("player1");
    });
  });

  // ─── BEST_OF_3 (regular, no MT) ──────────────────────────────
  describe("BEST_OF_3 (no MT)", () => {
    it("isMatchTiebreakSet: should never return true", () => {
      const setResults: SetEditData[] = [
        { p1Games: 6, p2Games: 4, isPartial: false },
        { p1Games: 3, p2Games: 6, isPartial: false },
      ];
      expect(isMatchTiebreakSet(2, setResults, "BEST_OF_3")).toBe(false);
    });

    it("isMatchTiebreakActive: always false", () => {
      expect(isMatchTiebreakActive("BEST_OF_3", 3, 1, 1)).toBe(false);
    });

    it("buildNewScoringState: set 3 should be regular (no MT)", () => {
      const setResults: SetEditData[] = [
        { p1Games: 6, p2Games: 4, isPartial: false },
        { p1Games: 3, p2Games: 6, isPartial: false },
        { p1Games: 6, p2Games: 4, isPartial: false },
      ];
      const state = buildNewScoringState({
        setResults,
        server: "player1",
        format: "BEST_OF_3",
      });
      expect(state.isFinished).toBe(true);
      expect(state.winner).toBe("player1");
      expect(state.sets[2].isTiebreak).toBe(false);
      expect(state.sets[2].tiebreakScore).toBeNull();
    });

    it("validateMatchTiebreakComplete: always valid (no MT)", () => {
      const setResults: SetEditData[] = [
        { p1Games: 6, p2Games: 4, isPartial: false },
        { p1Games: 3, p2Games: 6, isPartial: false },
      ];
      const result = validateMatchTiebreakComplete(setResults, "BEST_OF_3");
      expect(result.valid).toBe(true);
    });
  });

  // ─── PRO_SET_8 ────────────────────────────────────────────────
  describe("PRO_SET_8", () => {
    it("isMatchTiebreakSet: should never return true", () => {
      const setResults: SetEditData[] = [
        { p1Games: 7, p2Games: 5, isPartial: false },
      ];
      expect(isMatchTiebreakSet(0, setResults, "PRO_SET_8")).toBe(false);
    });

    it("isMatchTiebreakActive: always false", () => {
      expect(isMatchTiebreakActive("PRO_SET_8", 1, 0, 0)).toBe(false);
    });

    it("buildNewScoringState: regular pro set win", () => {
      const setResults: SetEditData[] = [
        { p1Games: 8, p2Games: 5, isPartial: false },
      ];
      const state = buildNewScoringState({
        setResults,
        server: "player1",
        format: "PRO_SET_8",
      });
      expect(state.isFinished).toBe(true);
      expect(state.winner).toBe("player1");
      expect(state.setsWon).toEqual({ player1: 1, player2: 0 });
    });

    it("validateMatchTiebreakComplete: always valid (no MT)", () => {
      const setResults: SetEditData[] = [
        { p1Games: 8, p2Games: 5, isPartial: false },
      ];
      const result = validateMatchTiebreakComplete(setResults, "PRO_SET_8");
      expect(result.valid).toBe(true);
    });
  });
});

import { describe, it, expect } from "@jest/globals";
import { GameScoreSchema, SetScoreSchema, MatchScoreStateSchema } from "../contracts";
import { tiebreakSet, validScoreState } from "./contractsTestKit";

describe("GameScoreSchema", () => {
  it("accepts valid game score", () => {
    expect(GameScoreSchema.safeParse({ player1: 0, player2: 0 }).success).toBe(true);
  });

  it("accepts with optional deuce and advantage", () => {
    expect(
      GameScoreSchema.safeParse({ player1: 3, player2: 3, isDeuce: true, advantage: "player1", secondServe: true })
        .success,
    ).toBe(true);
  });

  it("rejects negative scores", () => {
    expect(GameScoreSchema.safeParse({ player1: -1, player2: 0 }).success).toBe(false);
  });
});

describe("SetScoreSchema", () => {
  it("accepts valid set score", () => {
    expect(SetScoreSchema.safeParse({ player1: 6, player2: 4 }).success).toBe(true);
  });

  it("accepts tiebreak score", () => {
    expect(SetScoreSchema.safeParse(tiebreakSet).success).toBe(true);
  });

  it("rejects non-integer scores", () => {
    expect(SetScoreSchema.safeParse({ player1: 1.5, player2: 0 }).success).toBe(false);
  });
});

describe("MatchScoreStateSchema", () => {
  it("accepts valid match score state", () => {
    expect(MatchScoreStateSchema.safeParse(validScoreState).success).toBe(true);
  });

  it("rejects missing required fields", () => {
    expect(MatchScoreStateSchema.safeParse({}).success).toBe(false);
  });

  it("rejects invalid server value", () => {
    expect(MatchScoreStateSchema.safeParse({ ...validScoreState, server: "player3" }).success).toBe(false);
  });
});

import { scoreReducer, type ScoreAction } from "../useScoreReducer";
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

describe("scoreReducer", () => {
  const initial = buildScore();

  it("POINT_APPLIED returns the new state", () => {
    const next = buildScore({ sets: [{ player1: 4, player2: 3, isTiebreak: false } as any] });
    const result = scoreReducer(initial, { type: "POINT_APPLIED", payload: next });
    expect(result).toBe(next);
  });

  it("EDIT_CONFIRMED returns the edited state", () => {
    const edited = buildScore({ sets: [{ player1: 6, player2: 4, isTiebreak: false } as any] });
    const result = scoreReducer(initial, { type: "EDIT_CONFIRMED", payload: edited });
    expect(result).toBe(edited);
  });

  it("UNDO returns the previous state", () => {
    const prev = buildScore({ sets: [{ player1: 3, player2: 1, isTiebreak: false } as any] });
    const result = scoreReducer(initial, { type: "UNDO", payload: prev });
    expect(result).toBe(prev);
  });

  it("REDO returns the redone state", () => {
    const redone = buildScore({ sets: [{ player1: 4, player2: 2, isTiebreak: false } as any] });
    const result = scoreReducer(initial, { type: "REDO", payload: redone });
    expect(result).toBe(redone);
  });

  it("RESYNCED_FROM_SERVER returns the server state", () => {
    const server = buildScore({ sets: [{ player1: 5, player2: 5, isTiebreak: false } as any] });
    const result = scoreReducer(initial, { type: "RESYNCED_FROM_SERVER", payload: server });
    expect(result).toBe(server);
  });

  it("RESYNCED_FROM_SERVER with null returns null (no match loaded)", () => {
    const result = scoreReducer(null, { type: "RESYNCED_FROM_SERVER", payload: null });
    expect(result).toBeNull();
  });

  it("reducer is pure: does not mutate input state", () => {
    const frozen = buildScore();
    const next = buildScore({ sets: [{ player1: 6, player2: 4, isTiebreak: false } as any] });
    scoreReducer(frozen, { type: "POINT_APPLIED", payload: next });
    expect(frozen.sets[0].player1).toBe(3);
  });
});

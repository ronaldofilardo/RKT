import { useScoringPageDerived } from "../useScoringPageDerived";
import type { ScoringPageState } from "../useScoringPageState";
import type { ScoringPageHandlers } from "../useScoringPageEffects";
import type { ScoringState } from "@/core/scoring/types";

function buildScoreState(overrides: Partial<ScoringState> = {}): ScoringState {
  return {
    sets: [{ player1: 0, player2: 0, isTiebreak: true, tiebreakScore: { player1: 0, player2: 0 } } as any],
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

function buildState(overrides: Partial<ScoringPageState> = {}): ScoringPageState {
  const base = {
    match: { format: "MATCH_TB_10", initialServerId: "p1", player1: { id: "p1" }, player2: { id: "p2" } } as any,
    scoreState: buildScoreState(),
    engineRef: { current: null } as any,
    activeModal: null as any,
    gamePointToDisplay: (p: number) => String(p),
    timelinePoints: [],
    suspendedSession: null,
    session: { pendingEditScore: null },
  };
  return { ...base, ...overrides } as unknown as ScoringPageState;
}

const handlers = { isProcessing: false } as unknown as ScoringPageHandlers;

describe("useScoringPageDerived - server alternation in Match Tie Break (MATCH_TB_10)", () => {
  it("in virgin state (0x0 without points), honors initialServerId", () => {
    const virginState = buildState({
      match: { format: "MATCH_TB_10", initialServerId: "p2", player1: { id: "p1" }, player2: { id: "p2" } } as any,
      scoreState: buildScoreState({
        sets: [{ player1: 0, player2: 0, isTiebreak: true, tiebreakScore: { player1: 0, player2: 0 } } as any],
        server: "player1", // say default was player1
      }),
    });

    const derived = useScoringPageDerived(virginState, handlers);
    expect(derived.p1IsServing).toBe(false);
    expect(derived.p2IsServing).toBe(true);
    expect(derived.effectiveScoreState?.server).toBe("player2");
  });

  it("reflects server rotation to player2 after point 1 (1x0) in MATCH_TB_10", () => {
    const afterPoint1State = buildState({
      match: { format: "MATCH_TB_10", initialServerId: "p1", player1: { id: "p1" }, player2: { id: "p2" } } as any,
      scoreState: buildScoreState({
        sets: [{ player1: 0, player2: 0, isTiebreak: true, tiebreakScore: { player1: 1, player2: 0 } } as any],
        server: "player2", // rotated to player2 after point 1
      }),
    });

    const derived = useScoringPageDerived(afterPoint1State, handlers);
    expect(derived.p1IsServing).toBe(false);
    expect(derived.p2IsServing).toBe(true);
    expect(derived.effectiveScoreState?.server).toBe("player2");
  });

  it("reflects server rotation to player1 after point 3 (2x1) in MATCH_TB_10", () => {
    const afterPoint3State = buildState({
      match: { format: "MATCH_TB_10", initialServerId: "p1", player1: { id: "p1" }, player2: { id: "p2" } } as any,
      scoreState: buildScoreState({
        sets: [{ player1: 0, player2: 0, isTiebreak: true, tiebreakScore: { player1: 2, player2: 1 } } as any],
        server: "player1", // rotated to player1 after point 3
      }),
    });

    const derived = useScoringPageDerived(afterPoint3State, handlers);
    expect(derived.p1IsServing).toBe(true);
    expect(derived.p2IsServing).toBe(false);
    expect(derived.effectiveScoreState?.server).toBe("player1");
  });
});

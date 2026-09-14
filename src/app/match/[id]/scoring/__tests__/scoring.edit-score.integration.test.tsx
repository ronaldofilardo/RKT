/**
 * @jest-environment jsdom
 *
 * Integration test: edit-score lifecycle
 *
 * Verifies the contract between resolveDisplayScore, useScoringPageDerived,
 * and the session state transitions during the edit-score flow:
 *   1. Modal closed → effectiveScoreState = scoreState
 *   2. Modal opens with pendingEditScore → effectiveScoreState = pendingEditScore.scoreState
 *   3. Confirm clears pendingEditScore + updates scoreState + closes modal → effectiveScoreState = newScoreState
 */
import { renderHook } from "@testing-library/react";
import React from "react";
import { useScoringPageDerived } from "../useScoringPageDerived";
import { resolveDisplayScore } from "../resolveDisplayScore";
import type { ScoringPageState } from "../useScoringPageState";
import type { ScoringPageHandlers } from "../useScoringPageEffects";
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

function buildState(overrides: Partial<ScoringPageState> = {}): ScoringPageState {
  const base = {
    match: { format: "BEST_OF_3", player1: { id: "p1", name: "Alice" }, player2: { id: "p2", name: "Bob" } } as any,
    scoreState: buildScore(),
    engineRef: { current: null } as any,
    activeModal: null as string | null,
    gamePointToDisplay: (p: number) => String(p),
    timelinePoints: [],
    suspendedSession: null,
    session: { pendingEditScore: null },
  };
  return { ...base, ...overrides } as unknown as ScoringPageState;
}

const handlers = { isProcessing: false } as unknown as ScoringPageHandlers;

describe("edit-score integration: resolveDisplayScore ↔ useScoringPageDerived", () => {
  it("step 1: modal closed → effectiveScoreState is scoreState", () => {
    const scoreState = buildScore({ sets: [{ player1: 6, player2: 4, isTiebreak: false } as any] });
    const state = buildState({ scoreState });

    const { result } = renderHook(() => useScoringPageDerived(state, handlers));

    expect(result.current.effectiveScoreState).toBe(scoreState);
    expect(result.current.effectiveScoreState?.sets[0].player1).toBe(6);
  });

  it("step 2: modal opens with pendingEditScore → effectiveScoreState switches to pending snapshot", () => {
    const currentScore = buildScore({ sets: [{ player1: 3, player2: 2, isTiebreak: false } as any] });
    const pendingSnapshot = buildScore({ sets: [{ player1: 5, player2: 4, isTiebreak: false } as any] });

    const state = buildState({
      activeModal: "edit-score",
      scoreState: currentScore,
      session: { pendingEditScore: { scoreState: pendingSnapshot, floorSets: null } } as any,
    });

    const { result } = renderHook(() => useScoringPageDerived(state, handlers));

    expect(result.current.effectiveScoreState).toBe(pendingSnapshot);
    expect(result.current.effectiveScoreState?.sets[0].player1).toBe(5);
  });

  it("step 3: after confirm (pendingEditScore cleared, scoreState updated, modal closed) → effectiveScoreState is new scoreState", () => {
    const newScore = buildScore({ sets: [{ player1: 6, player2: 3, isTiebreak: false } as any] });

    const state = buildState({
      activeModal: null,
      scoreState: newScore,
      session: { pendingEditScore: null },
    });

    const { result } = renderHook(() => useScoringPageDerived(state, handlers));

    expect(result.current.effectiveScoreState).toBe(newScore);
    expect(result.current.effectiveScoreState?.sets[0].player1).toBe(6);
  });

  it("full lifecycle: closed → open → confirm → closed", () => {
    const initialScore = buildScore({ sets: [{ player1: 3, player2: 2, isTiebreak: false } as any] });
    const pendingSnapshot = buildScore({ sets: [{ player1: 5, player2: 4, isTiebreak: false } as any] });
    const confirmedScore = buildScore({ sets: [{ player1: 6, player2: 4, isTiebreak: false } as any] });

    // Step 1: closed
    const state1 = buildState({ scoreState: initialScore });
    const { result, rerender } = renderHook(
      ({ state }) => useScoringPageDerived(state, handlers),
      { initialProps: { state: state1 } },
    );
    expect(result.current.effectiveScoreState).toBe(initialScore);

    // Step 2: modal opens, pendingEditScore set
    const state2 = buildState({
      activeModal: "edit-score",
      scoreState: initialScore,
      session: { pendingEditScore: { scoreState: pendingSnapshot, floorSets: null } } as any,
    });
    rerender({ state: state2 });
    expect(result.current.effectiveScoreState).toBe(pendingSnapshot);

    // Step 3: confirm → pendingEditScore cleared, scoreState updated, modal closed
    const state3 = buildState({
      activeModal: null,
      scoreState: confirmedScore,
      session: { pendingEditScore: null },
    });
    rerender({ state: state3 });
    expect(result.current.effectiveScoreState).toBe(confirmedScore);
    expect(result.current.effectiveScoreState?.sets[0].player1).toBe(6);
  });

  it("regression: stale pendingEditScore does not persist after modal closes", () => {
    const freshScore = buildScore({ sets: [{ player1: 6, player2: 4, isTiebreak: false } as any] });
    const stalePending = buildScore({ sets: [{ player1: 3, player2: 2, isTiebreak: false } as any] });

    // Modal closed but pendingEditScore still has stale data (race condition scenario)
    const state = buildState({
      activeModal: null,
      scoreState: freshScore,
      session: { pendingEditScore: { scoreState: stalePending, floorSets: null } } as any,
    });

    const { result } = renderHook(() => useScoringPageDerived(state, handlers));

    // resolveDisplayScore must ignore pendingEditScore when modal is closed
    expect(result.current.effectiveScoreState).toBe(freshScore);
    expect(result.current.effectiveScoreState?.sets[0].player1).toBe(6);
  });

  it("resolveDisplayScore and useScoringPageDerived agree on the same result", () => {
    const scoreState = buildScore({ sets: [{ player1: 6, player2: 4, isTiebreak: false } as any] });
    const pending = buildScore({ sets: [{ player1: 5, player2: 4, isTiebreak: false } as any] });
    const suspended = { bankScoreState: buildScore({ sets: [{ player1: 4, player2: 2, isTiebreak: false } as any] }) };

    const scenarios = [
      { activeModal: null, desc: "closed, no pending" },
      { activeModal: "edit-score", desc: "open, with pending" },
      { activeModal: null, scoreState: null, desc: "closed, no score, suspended" },
      { activeModal: "edit-score", scoreState: null, desc: "open, no score, suspended" },
    ];

    for (const scenario of scenarios) {
      const state = buildState({
        activeModal: scenario.activeModal as any,
        scoreState: (scenario as any).scoreState ?? scoreState,
        session: { pendingEditScore: (scenario as any).desc.includes("pending") ? { scoreState: pending, floorSets: null } : null } as any,
        suspendedSession: (scenario as any).desc.includes("suspended") ? suspended : null,
      });

      const { result } = renderHook(() => useScoringPageDerived(state, handlers));

      const pureResult = resolveDisplayScore(
        state.activeModal,
        state.scoreState,
        (state as any).session?.pendingEditScore,
        state.suspendedSession,
      );

      expect(result.current.effectiveScoreState).toBe(pureResult);
    }
  });
});

import type { ScoringState } from "@/core/scoring/types";

export type ScoreAction =
  | { type: "POINT_APPLIED"; payload: ScoringState }
  | { type: "EDIT_CONFIRMED"; payload: ScoringState }
  | { type: "UNDO"; payload: ScoringState }
  | { type: "REDO"; payload: ScoringState }
  | { type: "RESYNCED_FROM_SERVER"; payload: ScoringState | null };

/**
 * Pure reducer for scoring state transitions.
 *
 * Every action sets the state to `payload` — the value is in semantic clarity
 * and testability, not in complex transitions. Side effects (engine loading,
 * pendingEditScore cleanup, modal closing) stay in the hooks that call dispatch.
 */
export function scoreReducer(
  _state: ScoringState | null,
  action: ScoreAction,
): ScoringState | null {
  switch (action.type) {
    case "POINT_APPLIED":
    case "EDIT_CONFIRMED":
    case "UNDO":
    case "REDO":
    case "RESYNCED_FROM_SERVER":
      return action.payload;
  }
}

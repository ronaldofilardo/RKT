import type { ScoringState } from "@/core/scoring/types";

interface PendingEditScore {
  scoreState: ScoringState;
  floorSets: { player1: number; player2: number } | null;
}

interface SuspendedSession {
  bankScoreState?: ScoringState | null;
}

/**
 * Resolve which ScoringState should be displayed in the scoring UI.
 *
 * Priority logic:
 * - When the edit-score modal is open (`activeModal === "edit-score"`):
 *   `pendingEditScore?.scoreState` > `scoreState` > `suspendedSession?.bankScoreState` > null
 * - When the modal is closed:
 *   `scoreState` > `suspendedSession?.bankScoreState` > null
 *
 * This function is pure — no hooks, no side effects.
 */
export function resolveDisplayScore(
  activeModal: string | null,
  scoreState: ScoringState | null,
  pendingEditScore: PendingEditScore | null | undefined,
  suspendedSession: SuspendedSession | null | undefined,
): ScoringState | null {
  if (activeModal === "edit-score") {
    return (
      pendingEditScore?.scoreState ??
      scoreState ??
      suspendedSession?.bankScoreState ??
      null
    );
  }

  return scoreState ?? suspendedSession?.bankScoreState ?? null;
}

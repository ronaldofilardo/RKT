import type { DoublesSetup } from "@/schemas/contracts";
import { unwrapStateEnvelope } from "@/core/scoring/state-envelope";

export function countCompletedSets(scoreState: unknown): number {
  const targetState = unwrapStateEnvelope(
    typeof scoreState === "string" ? JSON.parse(scoreState) : scoreState,
  );

  return (targetState?.sets ?? []).filter((s) => {
    if (s.isTiebreak && s.tiebreakScore) return true;
    return (s.player1 >= 6 || s.player2 >= 6) && Math.abs(s.player1 - s.player2) >= 2;
  }).length;
}

export function pruneDoublesSetupChanges(
  doublesSetup: unknown,
  scoreState: unknown,
): DoublesSetup | null {
  const currentSetup = (
    typeof doublesSetup === "string"
      ? JSON.parse(doublesSetup)
      : JSON.parse(JSON.stringify(doublesSetup))
  ) as DoublesSetup;

  const changes = currentSetup.changes;
  if (!Array.isArray(changes) || changes.length === 0) return null;

  const completedSets = countCompletedSets(scoreState);
  const filteredChanges = changes.filter((c) => c.afterSet < completedSets);
  if (filteredChanges.length === changes.length) return null;

  return { ...currentSetup, changes: filteredChanges };
}

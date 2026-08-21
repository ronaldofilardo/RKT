import type { ScoringState, HistoryEntry } from "@/core/scoring/types";
import { PERSIST, calculateBackoffDelay } from "@/lib/constants";

export function getAllowScoreEdit(label: string, explicit?: boolean): boolean {
  return explicit ?? (label === "edit-score" || label === "undo");
}

export function getPersistedScoreState(state: ScoringState, history?: HistoryEntry[]) {
  return history ? { state, history } : state;
}

export function getRetryDelay(attempt: number): number {
  return calculateBackoffDelay(attempt);
}

export function shouldExhaustRetries(attempt: number): boolean {
  return attempt === PERSIST.MAX_RETRIES;
}

import { isSetCompleted } from "@/app/match/[id]/scoring/scoringHelpers";
import type { TennisFormat } from "@/core/scoring/types";

export function resolveResumeScoreState(rawScoreState: any): any {
  if (!rawScoreState) return null;
  if (rawScoreState.sets && rawScoreState.currentGame) return rawScoreState;
  if (rawScoreState.state && Array.isArray(rawScoreState.history)) {
    return rawScoreState.state;
  }
  return null;
}

export function resolveFloorSets(scoreState: any, format: TennisFormat): any {
  if (!scoreState?.sets?.length) return null;

  const lastSet = scoreState.sets[scoreState.sets.length - 1];
  if (lastSet.isTiebreak && lastSet.tiebreakScore) return null;
  if (isSetCompleted(lastSet, format)) return null;

  return { player1: lastSet.player1, player2: lastSet.player2 };
}

export function buildResumeSession(match: any, scoreState: any): any {
  return {
    matchId: match.id,
    sessionId: match.suspendedSessionId ?? null,
    ...buildSessionStorageData(match, scoreState),
  };
}

export function buildSessionStorageData(match: any, scoreState: any): any {
  return {
    bankScoreState: scoreState,
    matchStateSnapshot: match.matchStateSnapshot,
    snapshotStatus: match.snapshotStatus ?? "IN_SYNC",
    snapshotPointCount: match.snapshotPointCount ?? 0,
    bankPointCount: match.bankPointCount ?? 0,
    suspendedSessionId: match.suspendedSessionId ?? null,
  };
}

interface StoredSessionData {
  bankScoreState?: any;
  matchStateSnapshot: any;
  snapshotStatus: string;
  snapshotPointCount: number;
  bankPointCount: number;
  suspendedSessionId?: string | null;
}

function parseStoredSnapshot(stored: string): Partial<StoredSessionData> | null {
  try {
    const parsed = JSON.parse(stored);
    if (!parsed.matchStateSnapshot) return null;
    return {
      matchStateSnapshot: parsed.matchStateSnapshot,
      snapshotStatus: parsed.snapshotStatus ?? "IN_SYNC",
      snapshotPointCount: parsed.snapshotPointCount ?? 0,
      bankPointCount: parsed.bankPointCount ?? 0,
    };
  } catch {
    return null;
  }
}

export function readStoredSessionData(
  matchId: string,
  isRealSuspendedSession: boolean,
  sessionStorageData: StoredSessionData
): StoredSessionData {
  if (isRealSuspendedSession) return sessionStorageData;

  const stored = sessionStorage.getItem(`suspended_session_${matchId}`);
  if (!stored) return sessionStorageData;

  const parsedSnapshot = parseStoredSnapshot(stored);
  return parsedSnapshot
    ? { ...sessionStorageData, ...parsedSnapshot }
    : sessionStorageData;
}

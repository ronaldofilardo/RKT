import type { TennisFormat, ScoringState } from '@/core/scoring/types';
import { getMatchFormatRules, isSetCompleteForFormat } from '@/lib/matchConfig';
import type { SnapshotStatus } from '@/lib/snapshot-utils';
import type { Match } from './dashboard.types';

export type ResumeMatch = Match & {
  suspendedSessionId?: string | null;
  snapshotStatus?: SnapshotStatus;
  snapshotPointCount?: number;
  bankPointCount?: number;
};
export type FloorSets = { player1: number; player2: number } | null;
export type StoredSessionData = {
  bankScoreState: ScoringState | null;
  matchStateSnapshot: string | null;
  snapshotStatus: SnapshotStatus;
  snapshotPointCount: number;
  bankPointCount: number;
  suspendedSessionId: string | null;
};
export type ResumeSession = { matchId: string; sessionId: string | null } & StoredSessionData;

type ScoreStateEnvelope = { state?: ScoringState; history?: unknown[] };
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null; }

export function resolveResumeScoreState(rawScoreState: unknown): ScoringState | null {
  if (!isRecord(rawScoreState)) return null;
  const candidate = rawScoreState as Partial<ScoringState> & ScoreStateEnvelope;
  if (candidate.sets && candidate.currentGame) return candidate as ScoringState;
  if (candidate.state && Array.isArray(candidate.history)) return candidate.state;
  return null;
}

export function resolveFloorSets(scoreState: ScoringState | null, format: TennisFormat): FloorSets {
  if (!scoreState?.sets?.length) return null;
  const lastSet = scoreState.sets[scoreState.sets.length - 1];
  if (lastSet.isTiebreak && lastSet.tiebreakScore) return null;
  if (isSetCompleteForFormat(lastSet, getMatchFormatRules(format))) return null;
  return { player1: lastSet.player1, player2: lastSet.player2 };
}

export function buildResumeSession(match: ResumeMatch, scoreState: ScoringState | null): ResumeSession {
  return { matchId: match.id, sessionId: match.suspendedSessionId ?? null, ...buildSessionStorageData(match, scoreState) };
}

const nullableString = (value: string | null | undefined): string | null => value ?? null;
const stringOrDefault = (value: SnapshotStatus | undefined, fallback: SnapshotStatus): SnapshotStatus => value ?? fallback;
const numberOrDefault = (value: number | undefined, fallback: number): number => value ?? fallback;

function getSessionMetadata(match: ResumeMatch): Omit<StoredSessionData, 'bankScoreState'> {
  return {
    matchStateSnapshot: nullableString(match.matchStateSnapshot),
    snapshotStatus: stringOrDefault(match.snapshotStatus, 'IN_SYNC'),
    snapshotPointCount: numberOrDefault(match.snapshotPointCount, 0),
    bankPointCount: numberOrDefault(match.bankPointCount, 0),
    suspendedSessionId: nullableString(match.suspendedSessionId),
  };
}

export function buildSessionStorageData(match: ResumeMatch, scoreState: ScoringState | null): StoredSessionData {
  return { bankScoreState: scoreState, ...getSessionMetadata(match) };
}

function parseStoredSnapshot(stored: string): Partial<Omit<StoredSessionData, 'bankScoreState'>> | null {
  try {
    const parsed: unknown = JSON.parse(stored);
    if (!isRecord(parsed) || typeof parsed.matchStateSnapshot !== 'string') return null;
    return {
      matchStateSnapshot: parsed.matchStateSnapshot,
      snapshotStatus: parsed.snapshotStatus === 'IN_SYNC' || parsed.snapshotStatus === 'SNAPSHOT_AHEAD' || parsed.snapshotStatus === 'BANK_AHEAD' ? parsed.snapshotStatus : 'IN_SYNC',
      snapshotPointCount: typeof parsed.snapshotPointCount === 'number' ? parsed.snapshotPointCount : 0,
      bankPointCount: typeof parsed.bankPointCount === 'number' ? parsed.bankPointCount : 0,
    };
  } catch { return null; }
}

export function readStoredSessionData(matchId: string, isRealSuspendedSession: boolean, sessionStorageData: StoredSessionData): StoredSessionData {
  if (isRealSuspendedSession) return sessionStorageData;
  const stored = sessionStorage.getItem(`suspended_session_${matchId}`);
  if (!stored) return sessionStorageData;
  const parsedSnapshot = parseStoredSnapshot(stored);
  return parsedSnapshot ? { ...sessionStorageData, ...parsedSnapshot } : sessionStorageData;
}

import type { ScoringState } from '@/core/scoring/types';
import type { SnapshotStatus } from '@/lib/snapshot-utils';

export type StoredSession = { bankScoreState: ScoringState | null; matchStateSnapshot: string | null; snapshotStatus: SnapshotStatus; snapshotPointCount: number; bankPointCount: number; suspendedSessionId: string | null; };
type UnknownRecord = Record<string, unknown>;
const asRecord = (value: unknown): UnknownRecord | null => value && typeof value === 'object' ? value as UnknownRecord : null;
const asString = (value: unknown) => typeof value === 'string' ? value : null;
const asNumber = (value: unknown, fallback: number) => typeof value === 'number' ? value : fallback;

export function readStoredSession(key: string): UnknownRecord | null { const stored = sessionStorage.getItem(key); if (!stored) return null; try { return asRecord(JSON.parse(stored)); } catch { return null; } }
export function preserveStoredValues(value: UnknownRecord | null) { return { snapshot: asString(value?.matchStateSnapshot), suspendedSessionId: asString(value?.suspendedSessionId) }; }
export function toSessionPayload(matchId: string, value: UnknownRecord): Omit<StoredSession, 'bankScoreState'> & { matchId: string; bankScoreState: ScoringState | null } { return { matchId, bankScoreState: (value.bankScoreState as ScoringState | null) ?? null, matchStateSnapshot: asString(value.matchStateSnapshot), snapshotStatus: (value.snapshotStatus as SnapshotStatus) ?? 'IN_SYNC', snapshotPointCount: asNumber(value.snapshotPointCount, 0), bankPointCount: asNumber(value.bankPointCount, 0), suspendedSessionId: asString(value.suspendedSessionId) }; }

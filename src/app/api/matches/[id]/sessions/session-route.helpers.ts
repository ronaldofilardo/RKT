import { logger } from '@/lib/logger';
import { computeSnapshotStatus, type SnapshotStatus } from '@/lib/snapshot-utils';

export function parseSnapshot(snapshot: string | null | undefined) {
  if (!snapshot) return null;
  try {
    return JSON.parse(snapshot);
  } catch (error) {
    logger.warn('[POST /api/matches/:id/sessions] snapshot parse failed:', error);
    return null;
  }
}

export function getSuspendedResponse(session: any, match: any) {
  const snapshotStr = session.matchStateSnapshot ?? null;
  const { snapshotStatus, snapshotPointCount } = computeSnapshotStatus(snapshotStr, match.version ?? 0);
  return {
    ...session,
    suspended: true,
    previousState: parseSnapshot(snapshotStr),
    snapshotStatus,
    snapshotPointCount,
    bankPointCount: match.version ?? 0,
    bankScoreState: match.scoreState ?? null,
  };
}

export function getSnapshotMetadata(snapshot: string | null | undefined, version: number) {
  if (!snapshot) return {};
  const result = computeSnapshotStatus(snapshot, version);
  return { snapshotStatus: result.snapshotStatus as SnapshotStatus, snapshotPointCount: result.snapshotPointCount };
}

function wasSuspendedSession(previousSession: any, isNew: boolean): boolean {
  return !isNew && previousSession?.isActive === false;
}

function getPreviousState(previousSession: any, suspended: boolean) {
  return suspended ? parseSnapshot(previousSession?.matchStateSnapshot) : null;
}

function getBankMetadata(metadata: any, match: any) {
  if (!metadata.snapshotStatus) return {};
  return { ...metadata, bankPointCount: match.version ?? 0, bankScoreState: match.scoreState ?? null };
}

export function getSessionResponse(session: any, previousSession: any, match: any, isNew: boolean) {
  const suspended = wasSuspendedSession(previousSession, isNew);
  const metadata = suspended ? getSnapshotMetadata(previousSession?.matchStateSnapshot, match.version ?? 0) : {};
  return {
    body: { ...session, suspended, previousState: getPreviousState(previousSession, suspended), ...getBankMetadata(metadata, match) },
    status: isNew ? 201 : 200,
  };
}

import { logger } from '@/lib/logger';

function getSnapshotString(session: any): string | null {
  const sessionSnapshot = session.matchStateSnapshot ?? null;
  const matchScoreState = session.match.scoreState
    ? typeof session.match.scoreState === 'string'
      ? session.match.scoreState
      : JSON.stringify(session.match.scoreState)
    : null;
  return sessionSnapshot ?? matchScoreState ?? null;
}

function parseSnapshot(snapshotString: string | null): unknown {
  try {
    return snapshotString ? JSON.parse(snapshotString) : null;
  } catch (error) {
    logger.warn('[suspended-sessions] snapshot parse failed (session):', error);
    return null;
  }
}

export function mapSuspendedSession(session: any) {
  const match = session.match;
  const snapshotString = getSnapshotString(session);
  const snapshot = parseSnapshot(snapshotString);

  return {
    id: match.id,
    player1: match.player1,
    player2: match.player2,
    state: match.state,
    format: match.format,
    sportType: match.sportType,
    scheduledAt: match.scheduledAt?.toISOString(),
    suspendedSessionId: session.id,
    matchStateSnapshot: snapshotString,
    scoreState: snapshot,
    snapshotStatus: 'IN_SYNC' as const,
    snapshotPointCount: 0,
    bankPointCount: 0,
  };
}

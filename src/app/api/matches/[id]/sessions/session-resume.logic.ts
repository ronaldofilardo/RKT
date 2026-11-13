import { NextResponse } from 'next/server';
import { computeSnapshotStatus } from '@/lib/snapshot.logic';
import { logger } from '@/lib/logger';

export async function resumeSuspendedSession(
  match: { version?: number | null; scoreState?: unknown; _count?: { pointLog?: number } | null },
  firstSession: { matchStateSnapshot?: string | null; isActive: boolean | null; [k: string]: unknown },
): Promise<NextResponse> {
  const snapshotStr = firstSession.matchStateSnapshot ?? null;
  let previousState = null;
  try {
    previousState = snapshotStr ? JSON.parse(snapshotStr) : null;
  } catch (e) {
    logger.warn('[POST /api/matches/:id/sessions] snapshot parse failed:', e);
  }

  const { snapshotStatus, snapshotPointCount } = computeSnapshotStatus(
    snapshotStr,
    match.version ?? 0,
    match._count?.pointLog,
  );

  return NextResponse.json({
    ...firstSession,
    suspended: true,
    previousState,
    snapshotStatus,
    snapshotPointCount,
    bankPointCount: match.version ?? 0,
    bankScoreState: match.scoreState ?? null,
  });
}


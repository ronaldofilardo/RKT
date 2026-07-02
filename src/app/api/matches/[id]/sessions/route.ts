import { NextRequest, NextResponse } from 'next/server';
import { requireRole, getUserFromRequest } from '@/lib/auth';
import {
  listSessions,
  checkMatchExists,
  getUserSessions,
  reactivateOrCreateSession,
} from '@/services/sessionService';
import { computeSnapshotStatus, type SnapshotStatus } from '@/lib/snapshot-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const roleCheck = await requireRole(request, 'SPECTATOR');
  if (roleCheck) return roleCheck;

  try {
    const { id: matchId } = await params;
    const sessions = await listSessions(matchId);
    return NextResponse.json(sessions);
  } catch (error) {
    console.error('[GET /api/matches/:id/sessions] Error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_SERVER_ERROR', message: 'Erro ao listar sessões' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const roleCheck = await requireRole(request, 'ATHLETE');
  if (roleCheck) return roleCheck;

  try {
    const { id: matchId } = await params;
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const match = await checkMatchExists(matchId);

    if (!match) {
      return NextResponse.json(
        { error: 'MATCH_NOT_FOUND' },
        { status: 404 }
      );
    }

    if (match.state === 'FINISHED') {
      return NextResponse.json(
        { error: 'MATCH_ALREADY_FINISHED' },
        { status: 409 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const autoStarted = body.autoStarted === true;

    const allSessions = await getUserSessions(matchId, user.id);

    if (autoStarted && allSessions.length > 0 && allSessions[0].isActive === false) {
      const snapshotStr = allSessions[0].matchStateSnapshot ?? null;
      let previousState = null;
      try {
        previousState = snapshotStr ? JSON.parse(snapshotStr) : null;
      } catch {}

      const { snapshotStatus, snapshotPointCount } = computeSnapshotStatus(snapshotStr, match.version ?? 0);

      return NextResponse.json({
        ...allSessions[0],
        suspended: true,
        previousState,
        snapshotStatus,
        snapshotPointCount,
        bankPointCount: match.version ?? 0,
        bankScoreState: match.scoreState ?? null,
      });
    }

    const isNew = allSessions.length === 0;
    const session = await reactivateOrCreateSession(matchId, user.id, allSessions);
    const wasSuspended = !isNew && allSessions[0].isActive === false;

    let snapshotStatus: SnapshotStatus | undefined;
    let snapshotPointCount: number | undefined;
    if (wasSuspended && allSessions[0]?.matchStateSnapshot) {
      const result = computeSnapshotStatus(allSessions[0].matchStateSnapshot, match.version ?? 0);
      snapshotStatus = result.snapshotStatus;
      snapshotPointCount = result.snapshotPointCount;
    }

    return NextResponse.json({
      ...session,
      suspended: wasSuspended,
      previousState:
        wasSuspended && allSessions[0]?.matchStateSnapshot
          ? JSON.parse(allSessions[0].matchStateSnapshot)
          : null,
      ...(snapshotStatus ? { snapshotStatus, snapshotPointCount, bankPointCount: match.version ?? 0, bankScoreState: match.scoreState ?? null } : {}),
    }, { status: isNew ? 201 : 200 });
  } catch (error) {
    console.error('[POST /api/matches/:id/sessions] Error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_SERVER_ERROR', message: 'Erro ao iniciar sessão' },
      { status: 500 }
    );
  }
}
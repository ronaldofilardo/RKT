import { NextRequest, NextResponse } from 'next/server';
import { checkMatchExists, getUserSessions, reactivateOrCreateSession } from '@/services/sessionService';
import { computeSnapshotStatus, type SnapshotStatus } from '@/lib/snapshot.logic';
import { StartSessionInputSchema } from '@/schemas/session';
import { logger } from '@/lib/logger';
import { resumeSuspendedSession } from './session-resume.logic';

type RLSUser = { id: string; role: string } | null | undefined;

export async function postSessionResponse(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
  user: RLSUser,
): Promise<NextResponse> {
  try {
    const { id: matchId } = await params;
    if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

    const match = await checkMatchExists(matchId);
    if (!match) return NextResponse.json({ error: 'MATCH_NOT_FOUND' }, { status: 404 });

    if ((match as { isTemplate?: boolean }).isTemplate) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Cartazes não possuem sessão de anotação direta' },
        { status: 403 },
      );
    }

    const ownerId = (match as { createdByUserId?: string | null }).createdByUserId;
    if (ownerId && ownerId !== user.id) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Apenas o anotador dono da partida pode abrir sessão' },
        { status: 403 },
      );
    }

    if (match.state === 'FINISHED') {
      return NextResponse.json({ error: 'MATCH_ALREADY_FINISHED' }, { status: 409 });
    }

    const rawBody = await request.json().catch(() => ({}));
    const parsedBody = StartSessionInputSchema.safeParse(rawBody);
    const autoStarted = parsedBody.success ? (parsedBody.data.autoStarted ?? false) : false;

    const allSessions = await getUserSessions(matchId, user.id);
    if (autoStarted && allSessions.length > 0 && allSessions[0].isActive === false) {
      return await resumeSuspendedSession(match, allSessions[0]);
    }

    const isNew = allSessions.length === 0;
    const session = await reactivateOrCreateSession(matchId, user.id);
    const wasSuspended = !isNew && allSessions[0].isActive === false;

    let snapshotStatus: SnapshotStatus | undefined;
    let snapshotPointCount: number | undefined;
    if (wasSuspended && allSessions[0]?.matchStateSnapshot) {
      const result = computeSnapshotStatus(
        allSessions[0].matchStateSnapshot,
        match.version ?? 0,
        match._count?.pointLog,
      );
      snapshotStatus = result.snapshotStatus;
      snapshotPointCount = result.snapshotPointCount;
    }

    return NextResponse.json(
      {
        ...session,
        suspended: wasSuspended,
        previousState:
          wasSuspended && allSessions[0]?.matchStateSnapshot
            ? JSON.parse(allSessions[0].matchStateSnapshot)
            : null,
        ...(snapshotStatus
          ? { snapshotStatus, snapshotPointCount, bankPointCount: match.version ?? 0, bankScoreState: match.scoreState ?? null }
          : {}),
      },
      { status: isNew ? 201 : 200 },
    );
  } catch (error) {
    logger.error('[POST /api/matches/:id/sessions] Error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_SERVER_ERROR', message: 'Erro ao criar sessão' },
      { status: 500 },
    );
  }
}

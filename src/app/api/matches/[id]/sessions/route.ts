import { NextRequest, NextResponse } from 'next/server';
import { withRLSHandler, withPermissionHandler } from '@/lib/auth';
import {
  listSessions,
  checkMatchExists,
  getUserSessions,
  reactivateOrCreateSession,
} from '@/services/sessionService';
import { computeSnapshotStatus, type SnapshotStatus } from '@/lib/snapshot.logic';
import { StartSessionInputSchema } from '@/schemas/session';
import { logger } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withRLSHandler(request, 'ANNOTATOR', async (_user) => {
    try {
      const { id: matchId } = await params;
      const sessions = await listSessions(matchId);
      return NextResponse.json(sessions);
    } catch (error) {
      logger.error('[GET /api/matches/:id/sessions] Error:', error);
      return NextResponse.json(
        { error: 'INTERNAL_SERVER_ERROR', message: 'Erro ao listar sessões' },
        { status: 500 }
      );
    }
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withPermissionHandler(request, 'annotate:session', async (user) => {
    try {
      const { id: matchId } = await params;
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

      // Body ausente/inválido → {} (schema é todo opcional; comportamento legado aceitava POST sem body)
      const rawBody = await request.json().catch(() => ({}));
      const parsedBody = StartSessionInputSchema.safeParse(rawBody);
      const autoStarted = parsedBody.success ? (parsedBody.data.autoStarted ?? false) : false;

      const allSessions = await getUserSessions(matchId, user.id);

      if (autoStarted && allSessions.length > 0 && allSessions[0].isActive === false) {
        const snapshotStr = allSessions[0].matchStateSnapshot ?? null;
        let previousState = null;
        try {
          previousState = snapshotStr ? JSON.parse(snapshotStr) : null;
        } catch (e) {
          logger.warn('[POST /api/matches/:id/sessions] snapshot parse failed:', e);
        }

        const { snapshotStatus, snapshotPointCount } = computeSnapshotStatus(snapshotStr, match.version ?? 0, match._count?.pointLog);

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
      const session = await reactivateOrCreateSession(matchId, user.id);
      const wasSuspended = !isNew && allSessions[0].isActive === false;

      let snapshotStatus: SnapshotStatus | undefined;
      let snapshotPointCount: number | undefined;
      if (wasSuspended && allSessions[0]?.matchStateSnapshot) {
        const result = computeSnapshotStatus(allSessions[0].matchStateSnapshot, match.version ?? 0, match._count?.pointLog);
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
      logger.error('[POST /api/matches/:id/sessions] Error:', error);
      return NextResponse.json(
        { error: 'INTERNAL_SERVER_ERROR', message: 'Erro ao criar sessão' },
        { status: 500 }
      );
    }
  });
}

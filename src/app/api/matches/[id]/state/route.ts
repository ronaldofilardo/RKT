import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { MatchStateInputSchema } from '@/schemas/contracts';
import { withRLSHandler, getRLSUser } from '@/lib/auth';
import { transitionMatchState } from '@/services/matchService';
import { prisma } from '@/lib/prisma';
import { emitMatchEvent } from '@/lib/match-events';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withRLSHandler(request, 'ANNOTATOR', async () => {
    try {
      const { id } = await params;
      const body = await request.json();
      const parsed = MatchStateInputSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          { error: 'VALIDATION_ERROR', details: parsed.error.flatten() },
          { status: 400 }
        );
      }

      const user = getRLSUser();
      const currentUserId = user?.id;

      const match = await prisma.match.findFirst({
        where: { id },
        select: {
          id: true,
          player1Id: true,
          player2Id: true,
          createdByUserId: true,
          openForAnnotation: true,
          state: true,
        },
      });

      if (!match) {
        return NextResponse.json({ error: 'MATCH_NOT_FOUND', message: 'Partida não encontrada' }, { status: 404 });
      }

      const isStaff = user?.role === 'ADMIN' || user?.role === 'GESTOR' || user?.role === 'COACH';
      const isParticipant =
        match.player1Id === currentUserId ||
        match.player2Id === currentUserId ||
        match.createdByUserId === currentUserId;
      const isOpenForAnnotation = match.openForAnnotation === true;

      const hasSessionModel = typeof (prisma as any).matchAnnotationSession?.findFirst === 'function';
      const activeSession = hasSessionModel
        ? await (prisma as any).matchAnnotationSession.findFirst({
            where: {
              matchId: id,
              isActive: true,
              annotatorUserId: currentUserId,
            },
          })
        : null;

      if (!isStaff && !isParticipant && !isOpenForAnnotation && hasSessionModel && !activeSession) {
        return NextResponse.json(
          { error: 'FORBIDDEN', message: 'Sem permissão para alterar o estado desta partida' },
          { status: 403 }
        );
      }

      if (match.state === 'FINISHED' && parsed.data.state === 'FINISHED') {
        const fullMatch = await prisma.match.findUnique({ where: { id } });
        return NextResponse.json({
          ...fullMatch,
          version: fullMatch?.version,
        });
      }

      const result = await transitionMatchState(
        id,
        parsed.data.state,
        parsed.data.initialServerId,
        parsed.data.scoreState,
        {
          allowScoreEdit: parsed.data.allowScoreEdit,
          expectedVersion: parsed.data.version,
          isManualScoreEdit: parsed.data.isManualScoreEdit,
          editedByUserId: user?.id,
          note: parsed.data.note,
          voidPointLogId: parsed.data.voidPointLogId,
        },
      );

      if (!result) {
        return NextResponse.json({ error: 'MATCH_NOT_FOUND' }, { status: 404 });
      }

      if ('error' in result) {
        const status = result.error === 'VERSION_CONFLICT' ? 409 : 422;
        if (result.error === 'VERSION_CONFLICT') {
          const current = await prisma.match.findUnique({
            where: { id },
            select: { version: true },
          });
          return NextResponse.json({
            error: 'VERSION_CONFLICT',
            message: 'Estado desatualizado. Outra atualização ocorreu simultaneamente.',
            currentVersion: current?.version,
            expectedVersion: parsed.data.version,
          }, { status: 409 });
        }
        return NextResponse.json({ error: result.error }, { status: status });
      }

      if (parsed.data.voidPointLogId) {
        emitMatchEvent(id, 'state_changed', {
          action: 'point_voided',
          pointId: parsed.data.voidPointLogId,
        });
      }

      emitMatchEvent(id, 'state_changed', { action: 'state_patch', scoreState: parsed.data.scoreState });

      return NextResponse.json({
        ...result,
        version: result.version,
      });
    } catch (error) {
      logger.error('[MATCH STATE]', error);
      return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
    }
  });
}

export const POST = PATCH;


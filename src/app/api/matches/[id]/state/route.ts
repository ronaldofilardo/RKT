import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { MatchStateInputSchema } from '@/schemas/contracts';
import { withRLSHandler, getRLSUser } from '@/lib/auth';
import { transitionMatchState } from '@/services/matchService';
import { prisma } from '@/lib/prisma';
import { emitMatchEvent } from '@/lib/match-events';

async function checkCanModifyMatchState(
  match: {
    player1Id: string;
    player2Id: string;
    createdByUserId?: string | null;
    openForAnnotation?: boolean | null;
  },
  matchId: string,
  user?: { id?: string; role?: string } | null,
): Promise<boolean> {
  const currentUserId = user?.id;
  const isStaff = user?.role === 'ADMIN' || user?.role === 'GESTOR' || user?.role === 'COACH';
  const isParticipant =
    match.player1Id === currentUserId ||
    match.player2Id === currentUserId ||
    match.createdByUserId === currentUserId;

  if (isStaff || isParticipant || match.openForAnnotation === true) {
    return true;
  }

  const hasSessionModel = typeof (prisma as any).matchAnnotationSession?.findFirst === 'function';
  if (!hasSessionModel) return true;

  const activeSession = await (prisma as any).matchAnnotationSession.findFirst({
    where: { matchId, isActive: true, annotatorUserId: currentUserId },
  });
  return Boolean(activeSession);
}

async function handleTransitionError(
  resultError: string | undefined,
  matchId: string,
  expectedVersion?: number,
): Promise<NextResponse> {
  if (resultError === 'VERSION_CONFLICT') {
    const current = await prisma.match.findUnique({
      where: { id: matchId },
      select: { version: true },
    });
    return NextResponse.json(
      {
        error: 'VERSION_CONFLICT',
        message: 'Estado desatualizado. Outra atualização ocorreu simultaneamente.',
        currentVersion: current?.version,
        expectedVersion,
      },
      { status: 409 },
    );
  }
  return NextResponse.json({ error: resultError || 'TRANSITION_ERROR' }, { status: 422 });
}

function emitStateEvents(id: string, voidPointLogId?: string, scoreState?: unknown): void {
  if (voidPointLogId) {
    emitMatchEvent(id, 'state_changed', { action: 'point_voided', pointId: voidPointLogId });
  }
  emitMatchEvent(id, 'state_changed', { action: 'state_patch', scoreState });
}

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

      const canModify = await checkCanModifyMatchState(match, id, user);
      if (!canModify) {
        return NextResponse.json(
          { error: 'FORBIDDEN', message: 'Sem permissão para alterar o estado desta partida' },
          { status: 403 }
        );
      }

      if (match.state === 'FINISHED' && parsed.data.state === 'FINISHED' && !parsed.data.allowScoreEdit) {
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
          voidLastPoint: parsed.data.voidLastPoint,
          isUndo: parsed.data.isUndo,
        },
      );

      if (!result) {
        return NextResponse.json({ error: 'MATCH_NOT_FOUND' }, { status: 404 });
      }

      if ('error' in result) {
        return handleTransitionError(result.error, id, parsed.data.version);
      }

      emitStateEvents(id, parsed.data.voidPointLogId, parsed.data.scoreState);

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

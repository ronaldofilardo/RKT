import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { MatchStateInputSchema } from '@/schemas/contracts';
import { getRLSUser } from '@/lib/auth';
import { transitionMatchState } from '@/services/matchService';
import { prisma } from '@/lib/prisma';
import { getActor } from '@/services/accessService';
import { checkCanModifyMatchState, reportTransitionFailure, emitStateEvents } from './state-route-guards.logic';

export async function patchMatchState(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const actor = user ? await getActor(user.id) : null;
    const match = await prisma.match.findFirst({
      where: { id },
      select: {
        id: true,
        player1Id: true,
        player2Id: true,
        player1PartnerId: true,
        player2PartnerId: true,
        createdByUserId: true,
        openForAnnotation: true,
        state: true,
      },
    });

    if (!match) {
      return NextResponse.json({ error: 'MATCH_NOT_FOUND', message: 'Partida não encontrada' }, { status: 404 });
    }

    const canModify = await checkCanModifyMatchState(match, id, user, actor?.athletePlayerId ?? null);
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
        doublesSetup: parsed.data.doublesSetup ?? undefined,
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
      return reportTransitionFailure(result.error, id, parsed.data.version);
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
}

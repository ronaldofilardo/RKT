import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { withAccessHandler } from '@/lib/access-handler';
import { prisma } from '@/lib/prisma';
import { finishMatch } from '@/services/matchService';
import { getActor } from '@/services/accessService';
import { FinishMatchInputSchema } from '@/schemas/contracts';
import { emitMatchEvent } from '@/lib/match-events';
import { checkCanModifyMatchState } from '../state/state-route-guards.logic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAccessHandler(request, null, null, async ({ user }) => {
    try {
      const { id } = await params;
      const body = await request.json();
      const parsed = FinishMatchInputSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          { error: 'VALIDATION_ERROR', details: parsed.error.flatten() },
          { status: 400 }
        );
      }

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
          sourceMatchId: true,
        },
      });

      if (!match) {
        return NextResponse.json({ error: 'MATCH_NOT_FOUND', message: 'Partida não encontrada' }, { status: 404 });
      }

      const actor = user ? await getActor(user.id) : null;
      const canModify = await checkCanModifyMatchState(match, id, user, actor?.athletePlayerId ?? null);
      if (!canModify) {
        return NextResponse.json(
          { error: 'FORBIDDEN', message: 'Sem permissão para alterar o estado desta partida' },
          { status: 403 }
        );
      }

      const result = await finishMatch(
        id,
        parsed.data.scoreState,
        {
          reason: parsed.data.reason,
          note: parsed.data.note,
          expectedVersion: parsed.data.version,
          winnerId: parsed.data.winnerId,
          isManualScoreEdit: parsed.data.isManualScoreEdit,
          editedByUserId: user?.id,
        }
      );

      if (!result) {
        return NextResponse.json({ error: 'MATCH_NOT_FOUND' }, { status: 404 });
      }

      if ('error' in result) {
        const status = result.error === 'VERSION_CONFLICT' ? 409 : 422;
        return NextResponse.json({ error: result.error }, { status });
      }

      emitMatchEvent(id, 'state_changed', { action: 'match_finished', scoreState: parsed.data.scoreState });

      // Avisos de Designação só saem do mural do treinador quando a partida é finalizada.
      try {
        const matchIds = [id, match.sourceMatchId].filter(Boolean) as string[];
        const assigned = await prisma.notification.findMany({
          where: {
            recipientId: user.id,
            type: 'ASSIGNED_TO_ANNOTATE',
            readAt: null,
          },
        });
        const toMark = assigned.filter(
          (n) =>
            matchIds.includes((n.payload as { matchId?: string; templateId?: string })?.matchId ?? '') ||
            matchIds.includes((n.payload as { matchId?: string; templateId?: string })?.templateId ?? ''),
        );
        if (toMark.length > 0) {
          await prisma.notification.updateMany({
            where: { id: { in: toMark.map((n) => n.id) } },
            data: { readAt: new Date() },
          });
        }
      } catch {
        // Não falha o encerramento da partida por erro ao desmarcar aviso.
      }

      return NextResponse.json(result);
    } catch (error) {
      logger.error('[MATCH FINISH]', error);
      return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
    }
  });
}
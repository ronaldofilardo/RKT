import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRLSHandler } from '@/lib/auth';
import { ArrangementInputSchema } from '@/schemas/contracts';
import { validateDoublesArrangement } from '@/core/scoring/doubles';
import type { DoublesConfig, DoublesArrangement } from '@/core/scoring/types';
import { emitMatchEvent } from '@/lib/match-events';
import { logger } from '@/lib/logger';
import { getPrismaErrorCode } from '@/lib/errors';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withRLSHandler(request, 'ANNOTATOR', async () => {
    try {
      const { id } = await params;
      const body = await request.json();
      const parsed = ArrangementInputSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          { error: 'VALIDATION_ERROR', details: parsed.error.flatten() },
          { status: 400 }
        );
      }

      const match = await prisma.match.findFirst({
        where: { id },
        include: { player1: true, player2: true, player1Partner: true, player2Partner: true },
      });

      if (!match) {
        return NextResponse.json({ error: 'MATCH_NOT_FOUND', message: 'Partida não encontrada' }, { status: 404 });
      }

      if (match.matchType !== 'DOUBLES') {
        return NextResponse.json(
          { error: 'NOT_A_DOUBLES_MATCH', message: 'Apenas partidas de duplas possuem arranjo de jogadores' },
          { status: 400 }
        );
      }

      if (!match.player1PartnerId || !match.player2PartnerId) {
        return NextResponse.json(
          { error: 'MISSING_PARTNERS', message: 'Partida de duplas incompleta' },
          { status: 400 }
        );
      }

      const doublesConfig: DoublesConfig = {
        members: {
          player1: [match.player1Id, match.player1PartnerId],
          player2: [match.player2Id, match.player2PartnerId],
        },
        initial: {
          serveOrder: parsed.data.serveOrder,
          receiveDeuce: parsed.data.receiveDeuce,
        },
      };

      const newArrangement: DoublesArrangement = {
        serveOrder: parsed.data.serveOrder,
        serveIndex: { player1: 0, player2: 0 },
        receiveDeuce: parsed.data.receiveDeuce,
      };

      if (!validateDoublesArrangement(doublesConfig, newArrangement)) {
        return NextResponse.json(
          { error: 'INVALID_DOUBLES_ARRANGEMENT', message: 'Arranjo de duplas inválido para os atletas desta partida' },
          { status: 400 }
        );
      }

      try {
        const updatedMatch = await prisma.$transaction(async (tx) => {
          // Atualiza scoreState
          const rawScoreState = typeof match.scoreState === 'string'
            ? JSON.parse(match.scoreState)
            : JSON.parse(JSON.stringify(match.scoreState ?? {}));
          const target = rawScoreState.state ?? rawScoreState;
          target.doubles = newArrangement;

          // Atualiza doublesSetup.changes
          const rawSetup = typeof match.doublesSetup === 'string'
            ? JSON.parse(match.doublesSetup)
            : JSON.parse(JSON.stringify(match.doublesSetup ?? {}));

          const existingChanges = Array.isArray(rawSetup.changes) ? rawSetup.changes : [];
          // Sobrescreve entrada existente do mesmo set (afterSet), se houver
          const filteredChanges = existingChanges.filter((c: any) => c.afterSet !== parsed.data.afterSet);
          filteredChanges.push({
            afterSet: parsed.data.afterSet,
            serveOrder: parsed.data.serveOrder,
            receiveDeuce: parsed.data.receiveDeuce,
            at: Date.now(),
          });

          const updatedSetup = {
            ...rawSetup,
            changes: filteredChanges,
          };

          return tx.match.update({
            where: { id, version: parsed.data.version },
            data: {
              scoreState: rawScoreState,
              doublesSetup: updatedSetup,
              version: { increment: 1 },
            },
            include: { player1: true, player2: true, player1Partner: true, player2Partner: true },
          });
        });

        emitMatchEvent(id, 'arrangement_updated', {
          arrangement: newArrangement,
          afterSet: parsed.data.afterSet,
          version: updatedMatch.version,
        });

        emitMatchEvent(id, 'state_changed', {
          scoreState: updatedMatch.scoreState,
          version: updatedMatch.version,
        });

        return NextResponse.json(updatedMatch);
      } catch (err) {
        if (getPrismaErrorCode(err) === 'P2025') {
          const current = await prisma.match.findUnique({
            where: { id },
            select: { version: true },
          });
          return NextResponse.json(
            {
              error: 'VERSION_CONFLICT',
              message: 'Estado desatualizado. Outra alteração ocorreu simultaneamente.',
              currentVersion: current?.version,
              expectedVersion: parsed.data.version,
            },
            { status: 409 }
          );
        }
        throw err;
      }
    } catch (error) {
      logger.error('[POST /api/matches/[id]/arrangement]', error);
      return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
    }
  });
}

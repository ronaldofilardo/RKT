import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRLSHandler } from '@/lib/auth';
import { ArrangementInputSchema } from '@/schemas/contracts';
import { validateDoublesArrangement } from '@/core/scoring/doubles';
import type { DoublesConfig, DoublesArrangement } from '@/core/scoring/types';
import { logger } from '@/lib/logger';
import { updateArrangementTransaction } from './arrangement-transaction.logic';

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

      return await updateArrangementTransaction(id, match, parsed.data, newArrangement);
    } catch (error) {
      logger.error('[POST /api/matches/[id]/arrangement]', error);
      return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
    }
  });
}

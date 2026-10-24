import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { DoublesSetup } from '@/schemas/contracts';
import type { DoublesArrangement } from '@/core/scoring/types';
import { emitMatchEvent } from '@/lib/match-events';
import { getPrismaErrorCode } from '@/lib/errors';

type ArrangementMatch = {
  scoreState: unknown;
  doublesSetup: unknown;
};

type ArrangementPayload = {
  afterSet: number;
  serveOrder: Record<'player1' | 'player2', [string, string]>;
  receiveDeuce: Record<'player1' | 'player2', string>;
  version: number;
};

export async function updateArrangementTransaction(
  id: string,
  match: ArrangementMatch,
  payload: ArrangementPayload,
  newArrangement: DoublesArrangement,
): Promise<NextResponse> {
  try {
    const updatedMatch = await prisma.$transaction(async (tx) => {
      // Atualiza scoreState
      const rawScoreState = typeof match.scoreState === 'string'
        ? JSON.parse(match.scoreState)
        : JSON.parse(JSON.stringify(match.scoreState ?? {}));
      const target = rawScoreState.state ?? rawScoreState;
      target.doubles = newArrangement;

      // Atualiza doublesSetup.changes
      const rawSetup = (
        typeof match.doublesSetup === 'string'
          ? JSON.parse(match.doublesSetup)
          : JSON.parse(JSON.stringify(match.doublesSetup ?? {}))
      ) as Partial<DoublesSetup>;

      const existingChanges: NonNullable<DoublesSetup['changes']> = Array.isArray(
        rawSetup.changes,
      )
        ? rawSetup.changes
        : [];
      // Sobrescreve entrada existente do mesmo set (afterSet), se houver
      const filteredChanges = existingChanges.filter(
        (c) => c.afterSet !== payload.afterSet,
      );
      filteredChanges.push({
        afterSet: payload.afterSet,
        serveOrder: payload.serveOrder,
        receiveDeuce: payload.receiveDeuce,
        at: Date.now(),
      });

      const updatedSetup = { ...rawSetup, changes: filteredChanges };

      return tx.match.update({
        where: { id, version: payload.version },
        data: {
          scoreState: rawScoreState,
          doublesSetup: updatedSetup,
          version: { increment: 1 },
        },
        include: { player1: true, player2: true, player1Partner: true, player2Partner: true },
      });
    });

    emitMatchEvent(id, 'arrangement_updated', { arrangement: newArrangement, afterSet: payload.afterSet, version: updatedMatch.version });

    emitMatchEvent(id, 'state_changed', { scoreState: updatedMatch.scoreState, version: updatedMatch.version });

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
          expectedVersion: payload.version,
        },
        { status: 409 }
      );
    }
    throw err;
  }
}

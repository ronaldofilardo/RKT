import type { Prisma } from '@prisma/client';
import { logger } from '@/lib/logger';
import type { ScoringState } from '@/core/scoring/types';
import { TransactionError, validateMatchAnnotatorPermission } from './route.logic';

export interface PointTransactionResult {
  scoreState: ScoringState;
  version: number;
  pointLogId: string;
}

export interface PointActorFinals {
  finalServerId: string;
  calculatedReceiverId: string | undefined;
  calculatedCourtSide: import('@/schemas/contracts').PointFlowInput['courtSide'];
  finalHitterId: string | undefined;
}

export type LoadedPointMatch = NonNullable<Awaited<ReturnType<typeof findMatchWithPlayers>>>;

async function findMatchWithPlayers(tx: Prisma.TransactionClient, id: string) {
  return tx.match.findFirst({
    where: { id },
    include: { player1: true, player2: true, player1Partner: true, player2Partner: true },
  });
}

export type LoadPointMatchResult =
  | { kind: 'existing'; result: PointTransactionResult }
  | { kind: 'match'; match: LoadedPointMatch };

export async function loadMatchForPoint(
  tx: Prisma.TransactionClient,
  id: string,
  clientEventId: string | undefined,
  userId: string | undefined,
  userRole: string | undefined,
): Promise<LoadPointMatchResult> {
  const match = await findMatchWithPlayers(tx, id);

  if (!match) {
    logger.point.matchNotFound(id);
    throw new TransactionError('Partida não encontrada', 404, 'MATCH_NOT_FOUND');
  }

  await validateMatchAnnotatorPermission(match, id, userId, userRole, tx);

  if (clientEventId) {
    const existingPoint = await tx.pointLog.findFirst({
      where: { matchId: id, clientEventId },
      select: { id: true },
    });
    if (existingPoint) {
      return {
        kind: 'existing',
        result: {
          scoreState: match.scoreState as unknown as ScoringState,
          version: match.version,
          pointLogId: existingPoint.id,
        },
      };
    }
  }

  if (match.state !== 'IN_PROGRESS') {
    logger.point.matchNotInProgress(match.state);
    throw new TransactionError('Partida não está em andamento', 422, 'MATCH_NOT_IN_PROGRESS');
  }

  if (!match.initialServerId) {
    logger.point.noInitialServer();
    throw new TransactionError('Defina o primeiro sacador antes de pontuar', 422, 'MATCH_NOT_STARTED');
  }

  return { kind: 'match', match };
}

import type { Prisma } from '@prisma/client';
import type { PointFlowInput } from '@/schemas/contracts';
import type { ScoringState } from '@/core/scoring/types';
import type { ScoringEngine } from '@/core/scoring/engine';
import { ScoreEnvelopeSchema } from '@/schemas/score';
import { logger } from '@/lib/logger';
import { TransactionError } from './route.logic';
import type { PointActorFinals } from './route-load.logic';

export function applyPointWithMappedErrors(
  engine: ScoringEngine,
  data: PointFlowInput,
  finals: PointActorFinals,
): ScoringState {
  logger.point.applying(data);
  try {
    const flowToApply = {
      ...data,
      serverId: finals.finalServerId,
      ...(finals.calculatedReceiverId !== undefined ? { receiverId: finals.calculatedReceiverId } : {}),
      ...(finals.calculatedCourtSide !== undefined ? { courtSide: finals.calculatedCourtSide } : {}),
      ...(finals.finalHitterId !== undefined ? { hitterId: finals.finalHitterId } : {}),
    };
    return engine.applyPoint(flowToApply);
  } catch (engineError) {
    const msg = engineError instanceof Error ? engineError.message : String(engineError);
    if (msg === 'MATCH_ALREADY_FINISHED') {
      throw new TransactionError('Partida já finalizada', 422, 'MATCH_ALREADY_FINISHED');
    }
    if (msg === 'INVALID_WINNER') {
      throw new TransactionError('Jogador vencedor inválido para esta partida', 400, 'INVALID_WINNER');
    }
    throw engineError;
  }
}

export async function persistMatchPoint(params: {
  tx: Prisma.TransactionClient;
  matchId: string;
  match: {
    version: number;
    startedAt: Date | null;
    player1Id: string;
    player2Id: string;
  };
  newState: ScoringState;
  expectedVersion: number;
}): Promise<void> {
  const { tx, matchId, match, newState, expectedVersion } = params;

  const isMatchFinished = newState.isFinished;
  // Performance fix: persiste snapshot enxuto { state: newState, history: [] } no caminho quente,
  // eliminando o custo quadrático de serializar e persistir histórico acumulado a cada ponto.
  const snapshot = {
    state: newState,
    history: [],
  };

  const envelopeParsed = ScoreEnvelopeSchema.safeParse(snapshot);
  if (!envelopeParsed.success) {
    logger.warn({
      message: "ScoreEnvelope format anomaly detected",
      matchId,
      issues: envelopeParsed.error.issues,
    });
  }

  logger.point.updatingMatch({ version: match.version, isFinished: isMatchFinished });
  const finishData = isMatchFinished
    ? {
        state: 'FINISHED' as const,
        finishedAt: new Date(),
        winnerId: newState.winner === 'player1' ? match.player1Id : match.player2Id,
      }
    : {};

  const startedAtData = !match.startedAt
    ? { startedAt: new Date(newState.startedAt ?? Date.now()) }
    : {};

  await tx.match.update({
    where: { id: matchId, version: expectedVersion },
    data: {
      scoreState: snapshot as unknown as Prisma.InputJsonValue,
      version: { increment: 1 },
      ...finishData,
      ...startedAtData,
    },
  });
}

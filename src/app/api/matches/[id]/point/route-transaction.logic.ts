import { prisma } from '@/lib/prisma';
import type { PointFlowInput } from '@/schemas/contracts';
import { logger } from '@/lib/logger';
import { restoreEngineFromMatch } from './route.logic';
import {
  loadMatchForPoint,
  type PointTransactionResult,
  type PointActorFinals,
} from './route-load.logic';
import { resolveDoublesActors } from './route-actors-doubles.logic';
import { validateSinglesActors } from './route-actors-singles.logic';
import { resolveNextSequence } from './route-sequence.logic';
import { applyPointWithMappedErrors, persistMatchPoint } from './route-apply.logic';
import { createPointLogEntry } from './route-pointlog.logic';
import { buildEngineConfig } from '@/core/scoring/engine-config';

export async function runPointTransaction(params: {
  matchId: string;
  data: PointFlowInput;
  userId?: string;
  userRole?: string;
}): Promise<PointTransactionResult | null> {
  const { matchId, data, userId, userRole } = params;

  return prisma.$transaction(async (tx) => {
    const loaded = await loadMatchForPoint(
      tx,
      matchId,
      data.clientEventId,
      userId,
      userRole,
    );
    if (loaded.kind === 'existing') return loaded.result;
    const match = loaded.match;

    logger.point.engineCreated();
    const engine = restoreEngineFromMatch(match as Parameters<typeof restoreEngineFromMatch>[0]);
    const prePointState = engine.getState();
    const isDoubles = match.matchType === 'DOUBLES';
    const engineConfig = buildEngineConfig(match);

    let finalServerId = data.serverId;
    let calculatedReceiverId = data.receiverId;
    let calculatedCourtSide = data.courtSide;
    let finalHitterId = data.hitterId;

    if (isDoubles) {
      const doublesActors = resolveDoublesActors({
        matchId,
        match,
        data,
        prePointState,
        engineConfig,
      });
      finalServerId = doublesActors.finalServerId;
      calculatedReceiverId = doublesActors.calculatedReceiverId;
      calculatedCourtSide = doublesActors.calculatedCourtSide;
      finalHitterId = doublesActors.finalHitterId;
    } else {
      validateSinglesActors({ matchId, match, data, engine });
    }

    const nextSequenceNumber = await resolveNextSequence(tx, matchId, data.sequenceNumber);

    const expectedVersion = match.version;
    const nextVersion = match.version + 1;

    const finals: PointActorFinals = {
      finalServerId,
      calculatedReceiverId,
      calculatedCourtSide,
      finalHitterId,
    };
    const newState = applyPointWithMappedErrors(engine, data, finals);
    await persistMatchPoint({ tx, matchId, match, newState, expectedVersion });
    const pointLog = await createPointLogEntry({
      tx,
      match,
      data,
      finals,
      nextSequenceNumber,
    });
    logger.point.transactionCompleted();
    logger.point.newStateSets(newState.sets);
    return { scoreState: newState, version: nextVersion, pointLogId: pointLog.id };
  });
}

import { prisma } from "@/lib/prisma";
import type { MatchState, MatchFormat } from "@/schemas/contracts";
import { logger } from "@/lib/logger";
import { getPrismaErrorCode } from "@/lib/errors";
import { validateTransitionState } from "./matchValidator";
import {
  recordScoreEditSegment,
  buildTransitionUpdateData,
  buildManualEditScoreState,
} from "./match-service-operations.logic";
import { pruneDoublesSetupChanges } from "./match-service-doubles.logic";
import { voidPointLogSegment } from "./match-service-voidpoint.logic";

export async function transitionMatchState(
  id: string,
  newState: MatchState,
  initialServerId?: string,
  scoreState?: unknown,
  options?: {
    doublesSetup?: unknown;
    allowScoreEdit?: boolean;
    expectedVersion?: number;
    isManualScoreEdit?: boolean;
    editedByUserId?: string;
    note?: string;
    voidPointLogId?: string;
    voidLastPoint?: boolean;
    isUndo?: boolean;
  },
) {
  const match = await prisma.match.findFirst({
    where: { id },
    include: { player1: true, player2: true, player1Partner: true, player2Partner: true },
  });
  if (!match) return null;

  const validation = validateTransitionState(
    {
      format: match.format as MatchFormat,
      matchType: match.matchType,
      player1Id: match.player1Id,
      player2Id: match.player2Id,
      player1PartnerId: match.player1PartnerId,
      player2PartnerId: match.player2PartnerId,
      initialServerId: match.initialServerId,
      scoreState: match.scoreState,
      state: match.state,
      doublesSetup: match.doublesSetup,
    },
    newState,
    scoreState,
    { ...options, isUndo: options?.isUndo },
  );

  if (!validation.valid) return { error: validation.error } as const;

  const whereClause = options?.expectedVersion !== undefined ? { id, version: options.expectedVersion } : { id };

  try {
    return await prisma.$transaction(async (tx) => {
      await recordScoreEditSegment(tx, id, options, match.scoreState, scoreState);

      await voidPointLogSegment(tx, id, options ?? {});

      const resolvedScoreState = options?.isManualScoreEdit && scoreState
        ? (typeof scoreState === 'object' && scoreState !== null && 'state' in scoreState ? scoreState : buildManualEditScoreState(scoreState))
        : scoreState;

      const updateData = buildTransitionUpdateData(
        newState,
        initialServerId,
        resolvedScoreState,
        match,
        options?.doublesSetup,
      );

      if (options?.isUndo && match.matchType === 'DOUBLES' && match.doublesSetup) {
        try {
          const prunedSetup = pruneDoublesSetupChanges(match.doublesSetup, scoreState);
          if (prunedSetup) {
            updateData.doublesSetup = prunedSetup;
          }
        } catch (e) {
          logger.warn('[transitionMatchState] Falha ao ajustar doublesSetup.changes no undo:', e);
        }
      }

      return tx.match.update({
        where: whereClause,
        data: updateData,
        include: { player1: true, player2: true, player1Partner: true, player2Partner: true },
      });
    });
  } catch (error) {
    if (getPrismaErrorCode(error) === 'P2025') {
      return { error: 'VERSION_CONFLICT' } as const;
    }
    throw error;
  }
}

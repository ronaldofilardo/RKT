import { prisma } from "@/lib/prisma";
import type { MatchFormat, MatchFinishReason } from "@/schemas/contracts";
import { getPrismaErrorCode } from "@/lib/errors";
import { validateFinishMatch } from "./matchValidator";
import {
  buildFinishUpdateData,
  resolvePersistedScoreState,
  recordScoreEditSegment,
  buildManualEditScoreState,
} from "./match-service-operations.logic";

export async function finishMatch(
  id: string,
  scoreState: unknown,
  options?: {
    reason?: MatchFinishReason;
    note?: string;
    winnerId?: string;
    expectedVersion?: number;
    isManualScoreEdit?: boolean;
    editedByUserId?: string;
  },
) {
  const match = await prisma.match.findFirst({
    where: { id },
    include: { player1: true, player2: true },
  });

  if (!match) return { error: 'MATCH_NOT_FOUND' } as const;

  const validation = validateFinishMatch(
    {
      format: match.format as MatchFormat,
      player1Id: match.player1Id,
      player2Id: match.player2Id,
      initialServerId: match.initialServerId,
      scoreState: match.scoreState,
      state: match.state,
    },
    scoreState,
    options?.reason,
  );

  if (!validation.valid) return { error: validation.error } as const;

  const resolvedScoreState = options?.isManualScoreEdit
    ? buildManualEditScoreState(scoreState)
    : resolvePersistedScoreState(scoreState, match.scoreState);

  const updateData = buildFinishUpdateData(
    resolvedScoreState,
    options?.reason,
    options?.note,
    options?.winnerId,
  );

  const whereClause = options?.expectedVersion !== undefined ? { id, version: options.expectedVersion } : { id };

  try {
    return await prisma.$transaction(async (tx) => {
      await recordScoreEditSegment(tx, id, options, match.scoreState, scoreState);
      return tx.match.update({ where: whereClause, data: updateData, include: { player1: true, player2: true } });
    });
  } catch (error) {
    if (getPrismaErrorCode(error) === 'P2025' && options?.expectedVersion !== undefined) {
      return { error: 'VERSION_CONFLICT' } as const;
    }
    throw error;
  }
}

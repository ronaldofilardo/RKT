import type { Prisma } from "@prisma/client";
import { logger } from '../lib/logger';
import type { DoublesArrangement, DoublesConfig } from '@/core/scoring/types';
import type { DoublesSetup } from '@/schemas/contracts';
import { validateDoublesArrangement } from '@/core/scoring/doubles';

/**
 * Guarda de envelope de scoreState: `{ state, history }` com history array
 * e state truthy. Equivalente tipado do padrão `as any` anterior.
 */
function isScoreStateEnvelope(
  value: unknown,
): value is { state: unknown; history: unknown[] } {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as { state?: unknown; history?: unknown };
  return Array.isArray(candidate.history) && Boolean(candidate.state);
}

export const ALLOWED_MATCH_FIELDS = [
  'nickname', 'sportType', 'courtType', 'visibility', 'openForAnnotation',
  'scheduledAt', 'initialServerId', 'tournamentName', 'clubName', 'category', 'roundName', 'round',
  'bracketType', 'temperature', 'humidity', 'details',
] as const;

type AllowedField = (typeof ALLOWED_MATCH_FIELDS)[number];

export function sanitizeMatchUpdate(data: Record<string, unknown>): Partial<Record<AllowedField, unknown>> {
  const sanitized: Partial<Record<AllowedField, unknown>> = {};
  for (const key of ALLOWED_MATCH_FIELDS) {
    if (data[key] !== undefined) sanitized[key] = data[key];
  }
  return sanitized;
}

export function buildMatchUpdateData(sanitized: Partial<Record<AllowedField, unknown>>) {
  const result: Record<string, unknown> = {};
  const assign = (key: AllowedField, value: unknown = sanitized[key]) => {
    if (value !== undefined) result[key] = value;
  };
  assign('nickname');
  assign('sportType');
  assign('courtType');
  assign('visibility');
  assign('openForAnnotation');
  if (sanitized.scheduledAt !== undefined) result.scheduledAt = new Date(sanitized.scheduledAt as string);
  assign('initialServerId');
  assign('tournamentName');
  assign('clubName');
  assign('category');
  if (sanitized.roundName !== undefined) result.roundName = sanitized.roundName;
  if (sanitized.round !== undefined) result.round = sanitized.round;
  assign('bracketType');
  assign('temperature');
  assign('humidity');
  assign('details');
  return result;
}

export function buildFinishUpdateData(
  scoreState: unknown,
  reason?: string,
  note?: string,
  winnerId?: string,
) {
  const updateData: Record<string, unknown> = {
    state: 'FINISHED',
    finishedAt: new Date(),
    finishReason: reason || 'COMPLETED',
  };
  if (scoreState) updateData.scoreState = scoreState;
  if (note) updateData.finishNote = note;
  if (winnerId) updateData.winnerId = winnerId;
  return updateData;
}

export function resolvePersistedScoreState(
  incomingScoreState: unknown,
  existingScoreState: unknown,
): unknown | undefined {
  const receivedHasHistory = isScoreStateEnvelope(incomingScoreState);
  const existingHasHistory = isScoreStateEnvelope(existingScoreState);

  if (receivedHasHistory) {
    return incomingScoreState;
  }
  if (incomingScoreState && !existingScoreState) {
    return incomingScoreState;
  }
  if (incomingScoreState && existingScoreState && !receivedHasHistory && existingHasHistory) {
    return {
      state: incomingScoreState,
      history: existingScoreState.history,
    };
  }
  // Se incoming não existe mas existing existe, manter existing
  if (!incomingScoreState && existingScoreState) {
    return existingScoreState;
  }
  return incomingScoreState ?? undefined;
}

export async function recordScoreEditSegment(
  tx: Prisma.TransactionClient,
  matchId: string,
  options?: {
    isManualScoreEdit?: boolean;
    editedByUserId?: string;
    note?: string;
  },
  previousScoreState?: unknown,
  newScoreState?: unknown,
): Promise<void> {
  const shouldRecordSegment = Boolean(options?.isManualScoreEdit) && Boolean(newScoreState);
  if (!shouldRecordSegment) return;

  const maxRow = await tx.pointLog.aggregate({
    where: { matchId, voidedAt: null, sequenceNumber: { not: null } },
    _max: { sequenceNumber: true },
  });
  const maxSeq = maxRow._max.sequenceNumber ?? 0;

  const enrichedNewScoreState =
    typeof newScoreState === 'object' && newScoreState !== null
      ? { ...(newScoreState as Record<string, unknown>), pointLogSequenceAtEdit: maxSeq }
      : newScoreState;

  await tx.matchScoreEdit.create({
    data: {
      matchId,
      editedByUserId: options?.editedByUserId ?? null,
      note: options?.note ?? null,
      previousScoreState: (previousScoreState ?? {}) as Prisma.InputJsonValue,
      newScoreState: enrichedNewScoreState as Prisma.InputJsonValue,
    },
  });
}

export function buildTransitionUpdateData(
  newState: string,
  initialServerId?: string,
  scoreState?: unknown,
  existingMatch?: {
    matchType?: string | null;
    player1Id: string;
    player2Id: string;
    player1PartnerId?: string | null;
    player2PartnerId?: string | null;
    scoreState: unknown;
    doublesSetup?: unknown;
  } | null,
  doublesSetupInput?: unknown,
): Record<string, unknown> {
  const updateData: Record<string, unknown> = {
    state: newState,
    version: { increment: 1 },
  };
  if (newState === 'IN_PROGRESS') {
    updateData.startedAt = new Date();
    updateData.finishedAt = null;
    updateData.winnerId = null;

    if (existingMatch?.matchType === 'DOUBLES') {
      const setup = (doublesSetupInput ?? existingMatch.doublesSetup) as
        | DoublesSetup
        | null
        | undefined;
      if (!setup || !setup.serveOrder || !setup.receiveDeuce) {
        throw new Error('DOUBLES_SETUP_REQUIRED: Partida de duplas exige doublesSetup para iniciar');
      }
      if (!existingMatch.player1PartnerId || !existingMatch.player2PartnerId) {
        throw new Error('DOUBLES_PARTNERS_REQUIRED: Partida de duplas exige parceiros definidos');
      }

      const doublesConfig: DoublesConfig = {
        members: {
          player1: [existingMatch.player1Id, existingMatch.player1PartnerId],
          player2: [existingMatch.player2Id, existingMatch.player2PartnerId],
        },
        initial: {
          serveOrder: setup.serveOrder,
          receiveDeuce: setup.receiveDeuce,
        },
      };

      const initialArrangement: DoublesArrangement = {
        serveOrder: setup.serveOrder,
        serveIndex: { player1: 0, player2: 0 },
        receiveDeuce: setup.receiveDeuce,
      };

      if (!validateDoublesArrangement(doublesConfig, initialArrangement)) {
        throw new Error('INVALID_DOUBLES_ARRANGEMENT: Arranjo inicial de duplas inválido');
      }

      updateData.doublesSetup = setup;

      if (!scoreState && existingMatch.scoreState) {
        try {
          const parsed = typeof existingMatch.scoreState === 'string'
            ? JSON.parse(existingMatch.scoreState)
            : JSON.parse(JSON.stringify(existingMatch.scoreState));
          const target = parsed.state ?? parsed;
          target.doubles = initialArrangement;
          if (initialServerId) {
            const isP2 = initialServerId === existingMatch.player2Id || initialServerId === existingMatch.player2PartnerId;
            target.server = isP2 ? 'player2' : 'player1';
          }
          updateData.scoreState = parsed;
        } catch (error) {
          logger.warn('[MATCH UPDATE] Falha ao reparsar scoreState para inicializar duplas:', error);
        }
      }
    }
  }
  if (newState === 'FINISHED') updateData.finishedAt = new Date();
  if (initialServerId) updateData.initialServerId = initialServerId;
  if (scoreState) {
    updateData.scoreState = scoreState;
  } else if (initialServerId && existingMatch?.scoreState && !updateData.scoreState) {
    try {
      const parsed = typeof existingMatch.scoreState === 'string'
        ? JSON.parse(existingMatch.scoreState)
        : JSON.parse(JSON.stringify(existingMatch.scoreState));
      const target = parsed.state ?? parsed;
      const isPlayer2 = initialServerId === existingMatch.player2Id || initialServerId === existingMatch.player2PartnerId;
      target.server = isPlayer2 ? 'player2' : 'player1';
      updateData.scoreState = parsed;
    } catch (error) {
      logger.warn('[MATCH UPDATE] Falha ao reparsar scoreState existente para troca de servidor inicial:', error);
    }
  }
  return updateData;
}


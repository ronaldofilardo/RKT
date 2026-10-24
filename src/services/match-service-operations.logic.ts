import { logger } from '../lib/logger';
import { applyDoublesStartUpdates } from './match-service-transition-doubles.logic';

export { ALLOWED_MATCH_FIELDS, sanitizeMatchUpdate, buildMatchUpdateData, buildFinishUpdateData } from './match-service-update-fields';
export { resolvePersistedScoreState, recordScoreEditSegment, buildManualEditScoreState } from './match-service-score-state.logic';
export type { AllowedField } from './match-service-update-fields';

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
    startedAt?: Date | string | null;
    doublesSetup?: unknown;
  } | null,
  doublesSetupInput?: unknown,
): Record<string, unknown> {
  const updateData: Record<string, unknown> = {
    state: newState,
    version: { increment: 1 },
  };
  if (newState === 'IN_PROGRESS') {
    if (!existingMatch?.startedAt) {
      updateData.startedAt = new Date();
    }
    updateData.finishedAt = null;
    updateData.winnerId = null;

    applyDoublesStartUpdates(updateData, existingMatch ?? null, doublesSetupInput, initialServerId, scoreState);
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


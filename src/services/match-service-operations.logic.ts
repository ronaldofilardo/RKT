import { logger } from '../lib/logger';
import type { DoublesArrangement, DoublesConfig } from '@/core/scoring/types';
import type { DoublesSetup } from '@/schemas/contracts';
import { validateDoublesArrangement } from '@/core/scoring/doubles';

export { ALLOWED_MATCH_FIELDS, sanitizeMatchUpdate, buildMatchUpdateData, buildFinishUpdateData } from './match-service-update-fields';
export { resolvePersistedScoreState, recordScoreEditSegment } from './match-service-score-state.logic';
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

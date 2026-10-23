import { logger } from '../lib/logger';
import type { DoublesArrangement, DoublesConfig } from '@/core/scoring/types';
import type { DoublesSetup } from '@/schemas/contracts';
import { validateDoublesArrangement } from '@/core/scoring/doubles';

/**
 * Valida e aplica no `updateData` tudo o que o IN_PROGRESS de partida de
 * duplas exige (setup/parceiros/arranjo) e o reparse do scoreState para
 * inicializar `doubles` + servidor. Mutação idêntica ao bloco original.
 */
export function applyDoublesStartUpdates(
  updateData: Record<string, unknown>,
  existingMatch: {
    matchType?: string | null;
    player1Id: string;
    player2Id: string;
    player1PartnerId?: string | null;
    player2PartnerId?: string | null;
    scoreState: unknown;
    doublesSetup?: unknown;
  } | null,
  doublesSetupInput: unknown,
  initialServerId: string | undefined,
  scoreState: unknown,
): void {
  if (existingMatch?.matchType !== 'DOUBLES') return;

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

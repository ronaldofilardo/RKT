import type { PointFlowInput } from '@/schemas/contracts';
import { logger } from '@/lib/logger';
import type { ScoringEngine } from '@/core/scoring/engine';
import { TransactionError } from './route.logic';

export interface SinglesActorsInput {
  matchId: string;
  match: {
    player1Id: string;
    player2Id: string;
  };
  data: PointFlowInput;
  engine: ScoringEngine;
}

export function validateSinglesActors(input: SinglesActorsInput): void {
  const { matchId, match, data, engine } = input;

  if (data.type === 'DOUBLE_FAULT' && data.winnerId === data.serverId) {
    throw new TransactionError(
      'Em um double fault, o vencedor do ponto deve ser o receptor, não o sacador',
      400,
      'DF_WINNER_MUST_BE_RECEIVER'
    );
  }

  if (data.type === 'ACE' && data.winnerId !== data.serverId) {
    throw new TransactionError(
      'Em um ace, o vencedor do ponto deve ser o sacador',
      400,
      'ACE_WINNER_MUST_BE_SERVER'
    );
  }

  // Modo Sombra (D5): auditar se data.serverId coincide com o engine restaurado sem bloquear
  const expectedEngineServer = typeof engine.getServer === 'function'
    ? engine.getServer()
    : (typeof engine.getState === 'function' ? engine.getState().server : undefined);
  const expectedServerId = expectedEngineServer === 'player1'
    ? match.player1Id
    : expectedEngineServer === 'player2'
    ? match.player2Id
    : undefined;

  if (data.serverId && expectedServerId && data.serverId !== expectedServerId) {
    logger.warn({
      message: '[POST /point shadow-mode] serverId mismatch',
      matchId,
      receivedServerId: data.serverId,
      expectedServerId,
      engineServer: expectedEngineServer,
      sequenceNumber: data.sequenceNumber,
    });
  }
}

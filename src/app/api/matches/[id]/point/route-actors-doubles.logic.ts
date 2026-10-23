import type { PointFlowInput } from '@/schemas/contracts';
import type { ScoringState, TennisFormat } from '@/core/scoring/types';
import { logger } from '@/lib/logger';
import {
  getServingMemberId,
  courtSide,
  getReceiverMemberId,
  sideOfPlayer,
  isNoAdDecidingPoint,
} from '@/core/scoring/doubles';
import { buildEngineConfig } from '@/core/scoring/engine-config';
import { TransactionError } from './route.logic';

type EngineConfig = ReturnType<typeof buildEngineConfig>;

export interface DoublesActorsInput {
  matchId: string;
  match: {
    player1Id: string;
    player1PartnerId: string | null;
    player2Id: string;
    player2PartnerId: string | null;
    format: string;
  };
  data: PointFlowInput;
  prePointState: ScoringState;
  engineConfig: EngineConfig;
}

export interface DoublesActors {
  finalServerId: string;
  calculatedReceiverId: string | undefined;
  calculatedCourtSide: PointFlowInput['courtSide'];
  finalHitterId: string | undefined;
}

export function resolveDoublesActors(input: DoublesActorsInput): DoublesActors {
  const { matchId, match, data, prePointState, engineConfig } = input;

  if (!engineConfig.doubles) {
    throw new TransactionError('Configuração de duplas ausente na partida', 400, 'DOUBLES_CONFIG_MISSING');
  }

  const serverMemberId = getServingMemberId(prePointState, engineConfig.doubles);
  const calculatedCourtSide = courtSide(prePointState);
  const calculatedReceiverId = getReceiverMemberId(prePointState, engineConfig.doubles, data.receiverId);
  let finalServerId: string = serverMemberId;
  let finalHitterId: string | undefined = data.hitterId;

  if (data.serverId && data.serverId !== serverMemberId) {
    logger.warn({
      message: '[POST /point doubles] client serverId diverged from server calculation, using server value',
      clientServerId: data.serverId,
      calculatedServerId: serverMemberId,
      matchId,
    });
  }

  const allMembers = [
    match.player1Id,
    match.player1PartnerId,
    match.player2Id,
    match.player2PartnerId,
  ].filter(Boolean) as string[];

  const winnerSide = sideOfPlayer(engineConfig.doubles, data.winnerId);
  if (!winnerSide) {
    throw new TransactionError('Jogador vencedor inválido para esta partida', 400, 'INVALID_WINNER');
  }

  const serverSide = prePointState.server;
  if (data.type === 'DOUBLE_FAULT' && winnerSide === serverSide) {
    throw new TransactionError('Em um double fault, o vencedor do ponto deve ser o receptor, não o sacador', 400, 'DF_WINNER_MUST_BE_RECEIVER');
  }

  if (data.type === 'ACE' && winnerSide !== serverSide) {
    throw new TransactionError('Em um ace, o vencedor do ponto deve ser o sacador', 400, 'ACE_WINNER_MUST_BE_SERVER');
  }

  if (data.hitterId && !allMembers.includes(data.hitterId)) {
    throw new TransactionError('hitterId deve ser um dos atletas da partida', 400, 'INVALID_HITTER');
  }

  if (data.type === 'ACE' || data.type === 'DOUBLE_FAULT') finalHitterId = finalServerId;

  if (data.receiverId && isNoAdDecidingPoint(prePointState, match.format as TennisFormat)) {
    const receivingSide = serverSide === 'player1' ? 'player2' : 'player1';
    const receivingMembers = engineConfig.doubles.members[receivingSide];
    if (!receivingMembers.includes(data.receiverId)) {
      throw new TransactionError('receiverId deve pertencer à dupla recebedora', 400, 'INVALID_RECEIVER');
    }
  }

  return { finalServerId, calculatedReceiverId, calculatedCourtSide, finalHitterId };
}

import type { PrismaClient } from '@prisma/client';
import type { CreateMatchInput, MatchFormat } from '@/schemas/contracts';
import { ValidationError } from '@/lib/errors';
import { logger } from '@/lib/logger';

export function validateCreateMatchPlayers(data: CreateMatchInput): void {
  if (data.player1Id === data.player2Id) {
    throw new ValidationError({ player2Id: ['Jogador 2 deve ser diferente do Jogador 1'] });
  }
}

export function warnMissingCreator(createdByUserId?: string): void {
  if (!createdByUserId) {
    logger.warn('[createMatch] createdByUserId ausente — partida será criada sem auditoria de autor (TD-045)');
  }
}

function buildCreateFormatFields(data: CreateMatchInput) {
  return {
    format: data.format as MatchFormat,
    sportType: data.sportType || 'TENNIS',
    courtType: data.courtType || null,
    nickname: data.nickname || null,
    visibility: data.visibility || 'PUBLIC',
    openForAnnotation: data.openForAnnotation || false,
  };
}

function buildCreateMetadataFields(data: CreateMatchInput) {
  return {
    tournamentName: data.tournamentName || null,
    category: data.category || null,
    round: data.round || data.roundName || null,
    bracketType: data.bracketType || null,
    temperature: data.temperature || null,
    humidity: data.humidity || null,
  };
}

function buildCreateDefaults(data: CreateMatchInput) {
  return {
    ...buildCreateFormatFields(data),
    ...buildCreateMetadataFields(data),
    state: 'SCHEDULED' as const,
    player1Id: data.player1Id,
    player2Id: data.player2Id,
  };
}

function buildCreateOptionalFields(data: CreateMatchInput, createdByUserId?: string) {
  return {
    ...(data.initialServerId ? { initialServerId: data.initialServerId } : {}),
    scheduledAt: data.scheduledAt || null,
    ...(createdByUserId ? { createdByUserId } : {}),
  };
}

export function buildCreateMatchData(data: CreateMatchInput, createdByUserId?: string) {
  return {
    ...buildCreateDefaults(data),
    ...buildCreateOptionalFields(data, createdByUserId),
  };
}

export type MatchTransactionClient = Parameters<Parameters<PrismaClient['$transaction']>[0]>[0];

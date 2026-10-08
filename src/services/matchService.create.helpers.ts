import type { CreateMatchInput, MatchFormat } from '@/schemas/contracts';
import { ValidationError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { getInitialGames } from '@/core/scoring/format-rules';

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
  const initGames = getInitialGames(data.format as MatchFormat);
  const initialScoreState = {
    sets: initGames > 0 ? [{ player1: initGames, player2: initGames, isTiebreak: false, tiebreakScore: null }] : [],
    currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
    server: data.initialServerId || data.player1Id, // fallback until proper initialServer is set
    isFinished: false,
    winner: null,
    setsWon: { player1: 0, player2: 0 },
    startedAt: null,
    secondServe: false,
  };

  return {
    ...buildCreateFormatFields(data),
    ...buildCreateMetadataFields(data),
    state: 'SCHEDULED' as const,
    player1Id: data.player1Id,
    player2Id: data.player2Id,
    scoreState: initialScoreState as any,
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


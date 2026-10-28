import type { CreateMatchInput, MatchFormat } from '@/schemas/contracts';
import type { Prisma } from '@prisma/client';
import { getInitialGames } from '@/core/scoring/format-rules';

function buildCreateFormatFields(data: CreateMatchInput) {
  return {
    format: data.format as MatchFormat,
    matchType: (data.matchType || 'SINGLES') as 'SINGLES' | 'DOUBLES',
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
    clubName: data.clubName || null,
    category: data.category || null,
    round: data.round || data.roundName || null,
    bracketType: data.bracketType || null,
    temperature: data.temperature || null,
    humidity: data.humidity || null,
    details: data.details || null,
  };
}

function buildCreateDefaults(data: CreateMatchInput) {
  const initGames = getInitialGames(data.format as MatchFormat);
  const server = data.initialServerId === data.player2Id ? 'player2' : 'player1';
  const initialScoreState = {
    sets: initGames > 0 ? [{ player1: initGames, player2: initGames, isTiebreak: false, tiebreakScore: null }] : [],
    currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
    server,
    isFinished: false,
    winner: null,
    setsWon: { player1: 0, player2: 0 },
    startedAt: null,
    secondServe: false,
  };

  return {
    ...buildCreateFormatFields(data),
    ...buildCreateMetadataFields(data),
    ...(data.ctId ? { ctId: data.ctId } : {}),
    state: 'SCHEDULED' as const,
    player1Id: data.player1Id,
    player2Id: data.player2Id,
    player1PartnerId: data.matchType === 'DOUBLES' ? data.player1PartnerId || null : null,
    player2PartnerId: data.matchType === 'DOUBLES' ? data.player2PartnerId || null : null,
    scoreState: initialScoreState as Prisma.InputJsonValue,
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

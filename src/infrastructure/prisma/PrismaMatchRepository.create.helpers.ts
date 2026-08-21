import type { Prisma } from '@prisma/client';
import type { MatchUpsertInput } from '../ports/match.repository.port';

function buildMatchFormatFields(input: MatchUpsertInput) {
  return {
    format: input.format,
    sportType: input.sportType || 'TENNIS',
    courtType: input.courtType || null,
    nickname: input.nickname || null,
    visibility: input.visibility as Prisma.MatchCreateInput['visibility'] || 'PUBLIC',
    openForAnnotation: input.openForAnnotation || false,
  };
}

function buildMatchMetadataFields(input: MatchUpsertInput) {
  return {
    tournamentName: input.tournamentName || null,
    category: input.category || null,
    round: input.round || input.roundName || null,
    bracketType: input.bracketType || null,
    temperature: input.temperature || null,
    humidity: input.humidity || null,
  };
}

function buildMatchDefaults(input: MatchUpsertInput): Prisma.MatchCreateInput {
  return {
    ...buildMatchFormatFields(input),
    ...buildMatchMetadataFields(input),
    state: 'SCHEDULED',
    player1: { connect: { id: input.player1Id } },
    player2: { connect: { id: input.player2Id } },
  };
}

function buildMatchOptionalFields(input: MatchUpsertInput): Partial<Prisma.MatchCreateInput> {
  return {
    ...(input.initialServerId ? { initialServerId: input.initialServerId } : {}),
    scheduledAt: input.scheduledAt || null,
    ...(input.createdByUserId ? { createdByUserId: input.createdByUserId } : {}),
  };
}

export function buildMatchCreateData(input: MatchUpsertInput): Prisma.MatchCreateInput {
  return {
    ...buildMatchDefaults(input),
    ...buildMatchOptionalFields(input),
  };
}

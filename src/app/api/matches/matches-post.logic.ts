import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { CreateMatchInputSchema } from '@/schemas/contracts';
import { createMatch } from '@/services/matchService';
import { findDuplicateMatch } from '@/services/matchSuggestionService';
import { validatedRequest } from '@/lib/api.logic';
import { ConflictError, ApiError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import { logger } from '@/lib/logger';
import { assertCtMembership } from './match-ct-access.logic';

type RLSUser = { id: string; role: string } | null | undefined;

type MatchInput = z.infer<typeof CreateMatchInputSchema>;

type MatchResult = Awaited<ReturnType<typeof createMatch>>;

async function createMatchWithDuplicateCheck(
  input: MatchInput,
  currentUserId: string | undefined,
): Promise<MatchResult> {
  return prisma.$transaction(async (tx) => {
    const [firstPlayer, secondPlayer] = [input.player1Id, input.player2Id].sort();
    const partnerIds = [input.player1PartnerId, input.player2PartnerId].filter(Boolean).sort();
    const lockKey = `match_create_${input.matchType}_${firstPlayer}_${secondPlayer}_${partnerIds.join('_')}`;
    const txWithRawSql = tx as Prisma.TransactionClient & {
      $executeRaw?: (strings: TemplateStringsArray, ...values: unknown[]) => Promise<unknown>;
    };
    if (typeof txWithRawSql.$executeRaw === 'function') {
      try {
        await txWithRawSql.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`;
      } catch (error) {
        logger.warn('[MATCH CREATE] Dialeto sem pg_advisory_xact_lock; lock de criação ignorado:', error);
      }
    }

    const duplicate = await findDuplicateMatch(
      input.player1Id,
      input.player2Id,
      input.scheduledAt ?? null,
      input.matchType ?? 'SINGLES',
      input.player1PartnerId ?? undefined,
      input.player2PartnerId ?? undefined,
      tx,
    );

    if (duplicate) {
      throw new ConflictError('Partida duplicada', {
        id: duplicate.id,
        playerP1: duplicate.player1?.name,
        playerP2: duplicate.player2?.name,
        matchType: duplicate.matchType,
        scheduledAt: duplicate.scheduledAt,
      });
    }

    return createMatch(input, currentUserId, tx);
  });
}

export async function postMatchResponse(
  request: NextRequest,
  user: RLSUser,
): Promise<NextResponse> {
  try {
    const { force, ...input } = await validatedRequest(request, CreateMatchInputSchema);

    const currentUserId = user?.id;
    await assertCtMembership(input.ctId, currentUserId);
    logger.match.created(currentUserId ?? "anonymous");

    if (!force) {
      const match = await createMatchWithDuplicateCheck(input, currentUserId);
      return NextResponse.json({ data: match, ...match }, { status: 201 });
    }

    const match = await createMatch(input, currentUserId);
    return NextResponse.json({ data: match, ...match }, { status: 201 });
  } catch (error) {
    logger.error('[MATCHES POST]', error);

    if (error instanceof ConflictError) {
      return NextResponse.json(
        { error: error.code, message: error.message, details: error.details },
        { status: error.status }
      );
    }

    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.code, message: error.message, details: error.details },
        { status: error.status }
      );
    }

    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Erro ao criar partida' },
      { status: 500 }
    );
  }
}

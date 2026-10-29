import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import { logger } from '@/lib/logger';
import { findDuplicateMatch } from '@/services/match-duplicate.service';
import { createMatch } from '@/services/matchService';
import { ConflictError } from '@/lib/errors';

type MatchInput = Parameters<typeof createMatch>[0];

async function createMatchWithDuplicateCheck(
  input: MatchInput,
  currentUserId: string | undefined,
): Promise<Awaited<ReturnType<typeof createMatch>>> {
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

export { createMatchWithDuplicateCheck };

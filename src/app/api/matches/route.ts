import { NextRequest, NextResponse } from 'next/server';
import { CreateMatchInputSchema, MatchStateSchema } from '@/schemas/contracts';
import { withRLSHandler, withPermissionHandler, getRLSUser } from '@/lib/auth';
import { listMatches, createMatch } from '@/services/matchService';
import { findDuplicateMatch } from '@/services/matchSuggestionService';
import { validatedRequest, handleApiError, extractPagination } from '@/lib/api-helpers';
import { ConflictError, ApiError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  return withRLSHandler(request, 'ANNOTATOR', async () => {
    try {
      const user = getRLSUser();
      if (!user || user.role !== 'ANNOTATOR') {
        return NextResponse.json({ data: { matches: [], nextCursor: null } });
      }

      const { searchParams } = request.nextUrl;
      const stateParam = searchParams.get('state');
      const { cursor, limit } = extractPagination(searchParams);

      let state: ReturnType<typeof MatchStateSchema.parse> | undefined;
      if (stateParam) {
        const parsed = MatchStateSchema.safeParse(stateParam);
        if (!parsed.success) {
          return NextResponse.json(
            {
              error: 'INVALID_STATE',
              message: `state deve ser um de: ${MatchStateSchema.options.join(', ')}`,
            },
            { status: 400 },
          );
        }
        state = parsed.data;
      }

      const matches = await listMatches(state, cursor, limit, user.id);
      const nextCursor = matches.length === limit ? matches[matches.length - 1].id : null;

      return NextResponse.json({ data: { matches, nextCursor } });
    } catch (error) {
      logger.error('[MATCHES GET]', error);
      return handleApiError(error);
    }
  });
}

export async function POST(request: NextRequest) {
  return withPermissionHandler(request, 'play:match', async () => {
    try {
      const { force, ...input } = await validatedRequest(request, CreateMatchInputSchema);

      const currentUserId = getRLSUser()?.id;
      logger.match.created(currentUserId ?? "anonymous");

      if (!force) {
        const match = await prisma.$transaction(async (tx) => {
          const [firstPlayer, secondPlayer] = [input.player1Id, input.player2Id].sort();
          const lockKey = `match_create_${firstPlayer}_${secondPlayer}`;
          if (typeof (tx as any).$executeRaw === 'function') {
            try {
              await (tx as any).$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`;
            } catch {
              // Ignora se dialeto do banco não suportar pg_advisory_xact_lock (ex.: testes)
            }
          }

          const duplicate = await findDuplicateMatch(
            input.player1Id,
            input.player2Id,
            input.scheduledAt ?? null,
            tx,
          );

          if (duplicate) {
            throw new ConflictError('Partida duplicada', {
              id: duplicate.id,
              playerP1: duplicate.player1?.name,
              playerP2: duplicate.player2?.name,
            });
          }

          return createMatch(input, currentUserId, tx);
        });
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
  });
}

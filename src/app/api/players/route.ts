import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { ListPlayersInputSchema, CreatePlayerInputSchema } from '@/schemas/contracts';
import { withRLSHandler, getRLSUser } from '@/lib/auth';
import { listPlayers, createPlayer } from '@/services/playerService';
import { jsonResponse, validatedRequest, handleApiError, extractPagination } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  return withRLSHandler(request, 'SPECTATOR', async () => {
    try {
      const { searchParams } = request.nextUrl;
      const userId = searchParams.get('userId');

      // Validar userId com Zod
      const parsed = ListPlayersInputSchema.safeParse({
        userId,
        cursor: searchParams.get('cursor') ?? undefined,
        limit: searchParams.get('limit') ?? '20',
      });

      if (!parsed.success) {
        return NextResponse.json(
          { error: 'VALIDATION_ERROR', details: parsed.error.flatten() },
          { status: 400 }
        );
      }

      const { cursor, limit } = extractPagination(searchParams);
      const players = await listPlayers(cursor, limit, parsed.data.userId);
      const nextCursor = players.length === limit ? players[players.length - 1].id : null;

      return jsonResponse({ players, nextCursor });
    } catch (error) {
      logger.error('[PLAYERS GET]', error);
      return handleApiError(error);
    }
  });
}

export async function POST(request: NextRequest) {
  return withRLSHandler(request, 'ATHLETE', async () => {
    try {
      // Validar body com Zod
      const body = await validatedRequest(request, CreatePlayerInputSchema);

      const user = getRLSUser();

      const player = await createPlayer({
        ...body,
        createdByUserId: user?.id || undefined,
      });

      return jsonResponse(player, { status: 201 });
    } catch (error) {
      logger.error('[PLAYERS POST]', error);
      return handleApiError(error);
    }
  });
}

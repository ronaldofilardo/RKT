import { NextRequest, NextResponse } from 'next/server';
import { withAccessHandler } from '@/lib/access-handler';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { getActor } from '@/services/accessService';
import { listPoolPlayers } from '@/services/player-service-pool.logic';
import { resolvePoolScope, toPoolPlayerView } from '@/core/access/pool';

const PoolListQuerySchema = z.object({
  q: z.string().min(1).max(100).optional(),
  myClub: z.enum(['true', 'false']).optional().default('false'),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type PoolPlayerListResponse = {
  data: {
    players: {
      id: string;
      name: string;
      athleteCode: string | null;
      club: string | null;
      minor: boolean;
    }[];
    nextCursor: string | null;
  };
};

export async function GET(request: NextRequest) {
  return withAccessHandler(request, 'athlete:search', null, async ({ user }) => {
    try {
      const searchParams = request.nextUrl.searchParams;
      const parsed = PoolListQuerySchema.safeParse({
        q: searchParams.get('q') ?? undefined,
        myClub: searchParams.get('myClub') ?? 'false',
        cursor: searchParams.get('cursor') ?? undefined,
        limit: searchParams.get('limit') ?? undefined,
      });
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'VALIDATION_ERROR', message: 'Parametros invalidos' },
          { status: 400 },
        );
      }

      const { q, myClub, cursor, limit } = parsed.data;
      const myClubEnabled = myClub === 'true';

      const actor = await getActor(user.id);
      if (!actor || !actor.isActive) {
        return NextResponse.json(
          { error: 'FORBIDDEN', message: 'Conta inativa ou inexistente' },
          { status: 403 },
        );
      }

      const scope = resolvePoolScope(actor, myClubEnabled);
      const ctIds = scope.kind === 'CT' ? scope.ctIds : null;

      const rows = await listPoolPlayers({ cursor, limit, q, ctIds });
      const now = new Date();
      const players = rows.map((row) => toPoolPlayerView(row, now));

      const nextCursor = limit && players.length === limit ? players[players.length - 1].id : null;

      return NextResponse.json(
        { data: { players, nextCursor } },
        { status: 200 },
      );
    } catch (error) {
      logger.error('[PLAYERS POOL GET]', error);
      return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
    }
  });
}

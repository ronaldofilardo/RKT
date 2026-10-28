import { NextRequest, NextResponse } from 'next/server';
import { withRLSHandler } from '@/lib/auth';
import { listPlayers } from '@/services/playerService';
import { handlePlayersPost } from './players-post.logic';

export async function GET(request: NextRequest) {
  return withRLSHandler(request, 'ANNOTATOR', async () => {
    try {
      const searchParams = request.nextUrl.searchParams;
      const userId = searchParams.get('userId') ?? undefined;
      const cursor = searchParams.get('cursor') ?? undefined;
      const rawLimit = searchParams.get('limit');
      const limit = rawLimit ? parseInt(rawLimit, 10) : undefined;

      const players = await listPlayers(cursor, limit, userId);
      const nextCursor = limit && players.length === limit ? players[players.length - 1].id : null;
      return NextResponse.json({ data: { players, nextCursor } }, { status: 200 });
    } catch (error) {
      return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
    }
  });
}

export async function POST(request: NextRequest) {
  return withRLSHandler(request, 'ANNOTATOR', async (user) => {
    const body = await request.json().catch(() => null);
    return handlePlayersPost(body, user.id);
  });
}

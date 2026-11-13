import { NextResponse, type NextRequest } from 'next/server';
import { canAnnotateMatch } from '@/core/access';
import { withAccessHandler } from '@/lib/access-handler';
import { getMatchAccess } from '@/services/match-access-service';

export function withPointOwnerAccess(
  request: NextRequest,
  matchId: string,
  handler: () => Promise<Response>,
): Promise<Response> {
  return withAccessHandler(request, 'match:annotate', null, async ({ actor }) => {
    const matchAccess = await getMatchAccess(matchId);
    if (!matchAccess) {
      return NextResponse.json({ error: 'MATCH_NOT_FOUND' }, { status: 404 });
    }
    if (!canAnnotateMatch(actor, matchAccess)) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Apenas o anotador dono pode alterar pontos desta partida' },
        { status: 403 },
      );
    }
    return handler();
  });
}


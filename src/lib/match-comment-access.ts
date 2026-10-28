import { NextResponse, type NextRequest } from 'next/server';
import { canReadMatchComments, type Permission } from '@/core/access';
import { withAccessHandler } from '@/lib/access-handler';
import { getMatchAccess } from '@/services/match-access-service';

export function withMatchCommentAccess(
  request: NextRequest,
  matchId: string,
  action: Permission,
  handler: () => Promise<Response>,
): Promise<Response> {
  return withAccessHandler(request, action, null, async ({ actor }) => {
    const matchAccess = await getMatchAccess(matchId);
    if (!matchAccess) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
    if (!canReadMatchComments(actor, matchAccess)) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }
    return handler();
  });
}

import { NextRequest } from 'next/server';
import { withAccessHandler } from '@/lib/access-handler';
import { withPermissionHandler } from '@/lib/auth';
import { getMatchesResponse } from './matches-get.logic';
import { postMatchResponse } from './matches-post.logic';

export async function GET(request: NextRequest) {
  return withAccessHandler(request, null, null, async ({ user, actor }) => {
    return getMatchesResponse(request, user, actor.followedPlayerIds, actor);
  });
}

export async function POST(request: NextRequest) {
  return withPermissionHandler(request, 'play:match', (user) => postMatchResponse(request, user));
}

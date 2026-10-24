import { NextRequest } from 'next/server';
import { withRLSHandler, withPermissionHandler } from '@/lib/auth';
import { getMatchesResponse } from './matches-get.logic';
import { postMatchResponse } from './matches-post.logic';

export async function GET(request: NextRequest) {
  return withRLSHandler(request, 'ANNOTATOR', (user) => getMatchesResponse(request, user));
}

export async function POST(request: NextRequest) {
  return withPermissionHandler(request, 'play:match', (user) => postMatchResponse(request, user));
}

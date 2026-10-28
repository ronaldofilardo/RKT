import { NextRequest } from 'next/server';
import { withMatchCommentAccess } from '@/lib/match-comment-access';
import { postCommentResponse } from './comments-post.logic';
import { getCommentsResponse } from './comments-get.logic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return withMatchCommentAccess(request, id, 'match:annotate', () => postCommentResponse(request, { params }));
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return withMatchCommentAccess(request, id, 'report:view', () => getCommentsResponse(request, { params }));
}

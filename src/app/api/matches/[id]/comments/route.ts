import { NextRequest } from 'next/server';
import { withRLSHandler } from '@/lib/auth';
import { postCommentResponse } from './comments-post.logic';
import { getCommentsResponse } from './comments-get.logic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withRLSHandler(request, 'ANNOTATOR', () => postCommentResponse(request, { params }));
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withRLSHandler(request, 'ANNOTATOR', () => getCommentsResponse(request, { params }));
}

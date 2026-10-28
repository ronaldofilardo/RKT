import { NextRequest } from 'next/server';
import { withMatchCommentAccess } from '@/lib/match-comment-access';
import { patchCommentResponse } from './comment-patch.logic';
import { deleteCommentResponse } from './comment-delete.logic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const { id } = await params;
  return withMatchCommentAccess(request, id, 'match:annotate', () => patchCommentResponse(request, { params }));
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const { id } = await params;
  return withMatchCommentAccess(request, id, 'match:annotate', () => deleteCommentResponse({ params }));
}

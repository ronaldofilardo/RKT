import { NextRequest } from 'next/server';
import { withRLSHandler } from '@/lib/auth';
import { patchCommentResponse } from './comment-patch.logic';
import { deleteCommentResponse } from './comment-delete.logic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  return withRLSHandler(request, 'ANNOTATOR', () => patchCommentResponse(request, { params }));
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  return withRLSHandler(request, 'ANNOTATOR', () => deleteCommentResponse({ params }));
}

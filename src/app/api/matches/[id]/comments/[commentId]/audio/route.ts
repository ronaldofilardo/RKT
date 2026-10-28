import { NextRequest } from 'next/server';
import { withMatchCommentAccess } from '@/lib/match-comment-access';
import { postCommentAudioResponse, deleteCommentAudioResponse } from './comment-audio-write.logic';
import { getCommentAudioResponse } from './comment-audio-read.logic';

// ============================================================================
// Rotas: /api/matches/[id]/comments/[commentId]/audio (POST | GET | DELETE)
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const { id } = await params;
  return withMatchCommentAccess(request, id, 'match:annotate', () => postCommentAudioResponse(request, { params }));
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const { id } = await params;
  return withMatchCommentAccess(request, id, 'report:view', () => getCommentAudioResponse({ params }));
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const { id } = await params;
  return withMatchCommentAccess(request, id, 'match:annotate', () => deleteCommentAudioResponse({ params }));
}

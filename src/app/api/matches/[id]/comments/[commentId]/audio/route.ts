import { NextRequest } from 'next/server';
import { withRLSHandler } from '@/lib/auth';
import { postCommentAudioResponse, deleteCommentAudioResponse } from './comment-audio-write.logic';
import { getCommentAudioResponse } from './comment-audio-read.logic';

// ============================================================================
// Rotas: /api/matches/[id]/comments/[commentId]/audio (POST | GET | DELETE)
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  return withRLSHandler(request, 'ANNOTATOR', () => postCommentAudioResponse(request, { params }));
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  return withRLSHandler(request, 'ANNOTATOR', () => getCommentAudioResponse({ params }));
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  return withRLSHandler(request, 'ANNOTATOR', () => deleteCommentAudioResponse({ params }));
}

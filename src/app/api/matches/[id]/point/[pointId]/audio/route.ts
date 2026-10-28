import { NextRequest } from 'next/server';
import { reportApiError } from '@/lib/api.logic';
import { logger } from '@/lib/logger';
import { deleteAudioResponse, getAudioResponse, postAudioResponse } from './audio-handlers';
import { withMatchCommentAccess } from '@/lib/match-comment-access';

// ============================================================================
// GET /api/matches/[id]/point/[pointId]/audio
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; pointId: string }> }
) {
  const { id, pointId } = await params;
  return withMatchCommentAccess(request, id, 'report:view', async () => {
    try {
      return await getAudioResponse(id, pointId);
    } catch (error) {
      logger.error('[AUDIO GET]', error);
      return reportApiError(error);
    }
  });
}

// ============================================================================
// POST /api/matches/[id]/point/[pointId]/audio
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; pointId: string }> }
) {
  const { id, pointId } = await params;
  return withMatchCommentAccess(request, id, 'match:annotate', async () => {
    try {
      return await postAudioResponse(id, pointId, request);
    } catch (error) {
      logger.error('[AUDIO POST]', error);
      return reportApiError(error);
    }
  });
}

// ============================================================================
// DELETE /api/matches/[id]/point/[pointId]/audio
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; pointId: string }> }
) {
  const { id, pointId } = await params;
  return withMatchCommentAccess(request, id, 'match:annotate', async () => {
    try {
      return await deleteAudioResponse(id, pointId);
    } catch (error) {
      logger.error('[AUDIO DELETE]', error);
      return reportApiError(error);
    }
  });
}

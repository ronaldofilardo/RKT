import { NextRequest } from 'next/server';
import { withRLSHandler } from '@/lib/auth';
import { reportApiError } from '@/lib/api.logic';
import { logger } from '@/lib/logger';
import { deleteAudioResponse, getAudioResponse, postAudioResponse } from './audio-handlers';

// ============================================================================
// GET /api/matches/[id]/point/[pointId]/audio
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; pointId: string }> }
) {
  return withRLSHandler(request, 'ANNOTATOR', async () => {
    try {
      const { id, pointId } = await params;
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
  return withRLSHandler(request, 'ANNOTATOR', async () => {
    try {
      const { id, pointId } = await params;
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
  return withRLSHandler(request, 'ANNOTATOR', async () => {
    try {
      const { id, pointId } = await params;
      return await deleteAudioResponse(id, pointId);
    } catch (error) {
      logger.error('[AUDIO DELETE]', error);
      return reportApiError(error);
    }
  });
}

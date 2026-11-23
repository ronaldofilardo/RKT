import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { reportApiError } from '@/lib/api.logic';
import { logger } from '@/lib/logger';
import { deleteAudioResponse, getAudioResponse, postAudioResponse } from './audio-handlers';
import { withMatchCommentAccess } from '@/lib/match-comment-access';
import { flexibleIdValidator } from '@/schemas/common';

const ParamsSchema = z.object({
  id: flexibleIdValidator,
  pointId: flexibleIdValidator,
});

// ============================================================================
// GET /api/matches/[id]/point/[pointId]/audio
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; pointId: string }> }
) {
  const parsedParams = ParamsSchema.safeParse(await params);
  if (!parsedParams.success) return NextResponse.json({ error: 'INVALID_PARAMS' }, { status: 400 });
  const { id, pointId } = parsedParams.data;
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
  const parsedParams = ParamsSchema.safeParse(await params);
  if (!parsedParams.success) return NextResponse.json({ error: 'INVALID_PARAMS' }, { status: 400 });
  const { id, pointId } = parsedParams.data;
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
  const parsedParams = ParamsSchema.safeParse(await params);
  if (!parsedParams.success) return NextResponse.json({ error: 'INVALID_PARAMS' }, { status: 400 });
  const { id, pointId } = parsedParams.data;
  return withMatchCommentAccess(request, id, 'match:annotate', async () => {
    try {
      return await deleteAudioResponse(id, pointId);
    } catch (error) {
      logger.error('[AUDIO DELETE]', error);
      return reportApiError(error);
    }
  });
}

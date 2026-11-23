import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { flexibleIdValidator } from '@/schemas/common';
import { withMatchCommentAccess } from '@/lib/match-comment-access';
import { postCommentAudioResponse, deleteCommentAudioResponse } from './comment-audio-write.logic';
import { getCommentAudioResponse } from './comment-audio-read.logic';

const ParamsSchema = z.object({
  id: flexibleIdValidator,
  commentId: flexibleIdValidator,
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const parsedParams = ParamsSchema.safeParse(await params);
  if (!parsedParams.success) {
    return NextResponse.json({ error: 'VALIDATION_ERROR', message: 'Parâmetros inválidos', details: parsedParams.error.flatten() }, { status: 400 });
  }
  const { id } = parsedParams.data;
  return withMatchCommentAccess(request, id, 'match:annotate', () => postCommentAudioResponse(request, { params }));
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const parsedParams = ParamsSchema.safeParse(await params);
  if (!parsedParams.success) {
    return NextResponse.json({ error: 'VALIDATION_ERROR', message: 'Parâmetros inválidos', details: parsedParams.error.flatten() }, { status: 400 });
  }
  const { id } = parsedParams.data;
  return withMatchCommentAccess(request, id, 'report:view', () => getCommentAudioResponse({ params }));
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const parsedParams = ParamsSchema.safeParse(await params);
  if (!parsedParams.success) {
    return NextResponse.json({ error: 'VALIDATION_ERROR', message: 'Parâmetros inválidos', details: parsedParams.error.flatten() }, { status: 400 });
  }
  const { id } = parsedParams.data;
  return withMatchCommentAccess(request, id, 'match:annotate', () => deleteCommentAudioResponse({ params }));
}

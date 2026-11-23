import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { flexibleIdValidator } from '@/schemas/common';
import { withMatchCommentAccess } from '@/lib/match-comment-access';
import { postCommentResponse } from './comments-post.logic';
import { getCommentsResponse } from './comments-get.logic';

const ParamsSchema = z.object({ id: flexibleIdValidator });

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const parsedParams = ParamsSchema.safeParse(await params);
  if (!parsedParams.success) {
    return NextResponse.json({ error: 'VALIDATION_ERROR', message: 'ID de partida inválido', details: parsedParams.error.flatten() }, { status: 400 });
  }
  const { id } = parsedParams.data;
  return withMatchCommentAccess(request, id, 'match:annotate', () => postCommentResponse(request, { params }));
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const parsedParams = ParamsSchema.safeParse(await params);
  if (!parsedParams.success) {
    return NextResponse.json({ error: 'VALIDATION_ERROR', message: 'ID de partida inválido', details: parsedParams.error.flatten() }, { status: 400 });
  }
  const { id } = parsedParams.data;
  return withMatchCommentAccess(request, id, 'report:view', () => getCommentsResponse(request, { params }));
}

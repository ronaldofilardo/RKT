import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAccessHandler } from '@/lib/access-handler';
import { createShareLink, listShareLinks } from '@/services/spectator-share.service';
import { CreateShareLinkInputSchema } from '@/schemas/spectate';
import { flexibleIdValidator } from '@/schemas/common';

const ParamsSchema = z.object({ id: flexibleIdValidator });

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAccessHandler(request, null, null, async ({ user }) => {
    const parsedParams = ParamsSchema.safeParse(await params);
    if (!parsedParams.success) return NextResponse.json({ error: 'INVALID_PARAMS' }, { status: 400 });
    const { id } = parsedParams.data;
    const body = await request.json().catch(() => ({}));
    const parsed = CreateShareLinkInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.flatten() }, { status: 400 });
    }

    const origin = request.headers.get('origin') || request.nextUrl.origin;
    const result = await createShareLink({
      matchId: id,
      userId: user.id,
      label: parsed.data.label,
      origin,
    });

    if (!result.ok) {
      return NextResponse.json({ error: 'FORBIDDEN', message: 'Apenas o criador ou anotador ativo pode gerar convites' }, { status: 403 });
    }
    return NextResponse.json(result, { status: 201 });
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAccessHandler(request, null, null, async ({ user }) => {
    const parsedParams = ParamsSchema.safeParse(await params);
    if (!parsedParams.success) return NextResponse.json({ error: 'INVALID_PARAMS' }, { status: 400 });
    const { id } = parsedParams.data;
    const result = await listShareLinks(id, user.id);
    if (!result.ok) {
      return NextResponse.json({ error: 'FORBIDDEN', message: 'Acesso negado' }, { status: 403 });
    }
    return NextResponse.json(result);
  });
}


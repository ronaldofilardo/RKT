import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAccessUserFromRequest } from '@/lib/auth-credentials.logic';
import { logger } from '@/lib/logger';
import { reportApiError } from '@/lib/api.logic';

const BodySchema = z.object({
  playerId: z.string().min(1),
  userId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getAccessUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Token de acesso requerido' },
        { status: 401 },
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { playerId } = parsed.data;
    const player = await prisma.player.findUnique({
      where: { id: playerId },
      select: { id: true, userId: true },
    });
    if (!player) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'Atleta não encontrado' }, { status: 404 });
    }
    if (player.userId && player.userId !== user.id) {
      return NextResponse.json(
        { error: 'CONFLICT', message: 'Atleta já possui conta vinculada' },
        { status: 409 },
      );
    }

    const existingClaim = await prisma.athleteClaim.findFirst({
      where: { userId: user.id, playerId, status: 'PENDING' },
    });
    if (existingClaim) {
      return NextResponse.json(
        { error: 'CONFLICT', message: 'Reivindicação já solicitada e pendente' },
        { status: 409 },
      );
    }

    const claim = await prisma.athleteClaim.create({
      data: { userId: user.id, playerId, status: 'PENDING' },
    });
    return NextResponse.json(claim, { status: 201 });
  } catch (error) {
    logger.error('[ATHLETE CLAIM POST]', error);
    return reportApiError(error);
  }
}

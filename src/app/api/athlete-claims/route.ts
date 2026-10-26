import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { reportApiError } from '@/lib/api.logic';

const BodySchema = z.object({
  userId: z.string().min(1),
  playerId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.flatten() }, { status: 400 });
    }
    const claim = await prisma.athleteClaim.create({
      data: { userId: parsed.data.userId, playerId: parsed.data.playerId, status: 'PENDING' },
    });
    return NextResponse.json(claim, { status: 201 });
  } catch (error) {
    logger.error('[ATHLETE CLAIM POST]', error);
    return reportApiError(error);
  }
}

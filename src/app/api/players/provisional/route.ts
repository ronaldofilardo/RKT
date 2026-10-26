import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { reportApiError } from '@/lib/api.logic';

const BodySchema = z.object({
  name: z.string().min(1).max(120),
  createdByUserId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.flatten() }, { status: 400 });
    }
    const player = await prisma.player.create({
      data: {
        name: parsed.data.name,
        createdByUserId: parsed.data.createdByUserId,
        identityStatus: 'PROVISIONAL',
      },
    });
    return NextResponse.json(player, { status: 201 });
  } catch (error) {
    logger.error('[PLAYER PROVISIONAL POST]', error);
    return reportApiError(error);
  }
}

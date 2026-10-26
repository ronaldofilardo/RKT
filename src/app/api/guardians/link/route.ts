import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { reportApiError } from '@/lib/api.logic';

const BodySchema = z.object({
  guardianUserId: z.string().min(1),
  playerId: z.string().min(1),
  relation: z.string().max(40).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.flatten() }, { status: 400 });
    }
    const link = await prisma.guardianLink.create({
      data: {
        guardianUserId: parsed.data.guardianUserId,
        playerId: parsed.data.playerId,
        relation: parsed.data.relation ?? null,
      },
    });
    return NextResponse.json(link, { status: 201 });
  } catch (error) {
    logger.error('[GUARDIAN LINK POST]', error);
    return reportApiError(error);
  }
}

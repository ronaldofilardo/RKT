import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { reportApiError } from '@/lib/api.logic';

const BodySchema = z.object({
  sourceId: z.string().min(1),
  targetId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.flatten() }, { status: 400 });
    }
    const { sourceId, targetId } = parsed.data;
    await prisma.player.update({ where: { id: sourceId }, data: { mergedIntoId: targetId } });
    return NextResponse.json({ message: 'Mesclagem registrada.' }, { status: 200 });
  } catch (error) {
    logger.error('[PLAYER MERGE POST]', error);
    return reportApiError(error);
  }
}

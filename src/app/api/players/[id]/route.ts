import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { reportApiError } from '@/lib/api.logic';

const BodySchema = z.object({
  name: z.string().min(1).max(120).optional(),
  identityStatus: z.enum(['CONFIRMED', 'PROVISIONAL']).optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await request.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.flatten() }, { status: 400 });
    }
    const player = await prisma.player.update({ where: { id }, data: parsed.data });
    return NextResponse.json(player, { status: 200 });
  } catch (error) {
    logger.error('[PLAYER PATCH]', error);
    return reportApiError(error);
  }
}

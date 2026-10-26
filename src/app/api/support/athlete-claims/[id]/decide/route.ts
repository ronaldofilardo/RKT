import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { reportApiError } from '@/lib/api.logic';

const BodySchema = z.object({ status: z.enum(['APPROVED', 'REJECTED']), decidedByUserId: z.string().min(1) });

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await request.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.flatten() }, { status: 400 });
    }
    const claim = await prisma.athleteClaim.update({
      where: { id },
      data: { status: parsed.data.status, decidedByUserId: parsed.data.decidedByUserId },
    });
    if (parsed.data.status === 'APPROVED') {
      await prisma.player.update({
        where: { id: claim.playerId },
        data: { userId: claim.userId },
      });
    }
    return NextResponse.json(claim, { status: 200 });
  } catch (error) {
    logger.error('[ATHLETE CLAIM DECIDE POST]', error);
    return reportApiError(error);
  }
}

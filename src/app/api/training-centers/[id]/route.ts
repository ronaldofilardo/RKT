import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { reportApiError } from '@/lib/api.logic';

const BodySchema = z.object({ status: z.enum(['ACTIVE', 'SUSPENDED', 'ENDED']).optional(), name: z.string().min(2).max(120).optional() });

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await request.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.flatten() }, { status: 400 });
    }
    const ct = await prisma.trainingCenter.update({ where: { id }, data: parsed.data });
    return NextResponse.json(ct, { status: 200 });
  } catch (error) {
    logger.error('[TRAINING CENTER PATCH]', error);
    return reportApiError(error);
  }
}

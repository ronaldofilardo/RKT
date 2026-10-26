import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { reportApiError } from '@/lib/api.logic';

const BodySchema = z.object({ status: z.enum(['ACTIVE', 'SUSPENDED', 'ENDED']) });

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await request.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.flatten() }, { status: 400 });
    }
    const m = await prisma.membership.update({
      where: { id },
      data: { status: parsed.data.status, endedAt: parsed.data.status === 'ENDED' ? new Date() : null },
    });
    return NextResponse.json(m, { status: 200 });
  } catch (error) {
    logger.error('[MEMBERSHIP PATCH]', error);
    return reportApiError(error);
  }
}

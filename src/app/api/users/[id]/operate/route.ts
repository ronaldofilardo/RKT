import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { reportApiError } from '@/lib/api.logic';

const BodySchema = z.object({ canOperate: z.boolean() });

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await request.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.flatten() }, { status: 400 });
    }
    const user = await prisma.user.update({
      where: { id },
      data: { canOperate: parsed.data.canOperate },
    });
    return NextResponse.json({ id: user.id, canOperate: user.canOperate }, { status: 200 });
  } catch (error) {
    logger.error('[USER OPERATE PATCH]', error);
    return reportApiError(error);
  }
}

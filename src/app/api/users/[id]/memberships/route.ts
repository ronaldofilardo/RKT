import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { flexibleIdValidator } from '@/schemas/common';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { reportApiError } from '@/lib/api.logic';

const ParamsSchema = z.object({ id: flexibleIdValidator });

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const parsedParams = ParamsSchema.safeParse(await params);
  if (!parsedParams.success) {
    return NextResponse.json({ error: 'VALIDATION_ERROR', message: 'ID de usuário inválido', details: parsedParams.error.flatten() }, { status: 400 });
  }
  const { id } = parsedParams.data;
  try {
    const items = await prisma.membership.findMany({ where: { userId: id } });
    return NextResponse.json({ items }, { status: 200 });
  } catch (error) {
    logger.error('[USER MEMBERSHIPS GET]', error);
    return reportApiError(error);
  }
}

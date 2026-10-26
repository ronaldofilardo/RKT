import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { reportApiError } from '@/lib/api.logic';

const BodySchema = z.object({
  userId: z.string().min(1),
  kind: z.enum(['PLATAFORMA', 'GESTOR', 'TREINADOR']),
  ctId: z.string().optional(),
  preset: z.enum(['ADMIN', 'SUPORTE']).optional(),
});

export async function GET(_request: NextRequest) {
  try {
    const items = await prisma.membership.findMany({ orderBy: { createdAt: 'desc' }, take: 200 });
    return NextResponse.json({ items }, { status: 200 });
  } catch (error) {
    logger.error('[MEMBERSHIPS GET]', error);
    return reportApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.flatten() }, { status: 400 });
    }
    const m = await prisma.membership.create({
      data: {
        userId: parsed.data.userId,
        kind: parsed.data.kind,
        ctId: parsed.data.ctId,
        preset: parsed.data.preset,
        status: 'ACTIVE',
      },
    });
    return NextResponse.json(m, { status: 201 });
  } catch (error) {
    logger.error('[MEMBERSHIP POST]', error);
    return reportApiError(error);
  }
}

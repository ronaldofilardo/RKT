import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { reportApiError } from '@/lib/api.logic';

const BodySchema = z.object({
  name: z.string().min(2).max(120),
  slug: z.string().min(2).max(60),
});

export async function GET(_request: NextRequest) {
  try {
    const items = await prisma.trainingCenter.findMany({ orderBy: { name: 'asc' } });
    return NextResponse.json({ items }, { status: 200 });
  } catch (error) {
    logger.error('[TRAINING CENTERS GET]', error);
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
    const ct = await prisma.trainingCenter.create({
      data: { name: parsed.data.name, slug: parsed.data.slug, status: 'ACTIVE' },
    });
    return NextResponse.json(ct, { status: 201 });
  } catch (error) {
    logger.error('[TRAINING CENTER POST]', error);
    return reportApiError(error);
  }
}

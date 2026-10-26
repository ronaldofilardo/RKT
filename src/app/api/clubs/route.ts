import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { reportApiError } from '@/lib/api.logic';

const BodySchema = z.object({
  name: z.string().min(2).max(120),
  city: z.string().max(80).optional(),
});

export async function GET(_request: NextRequest) {
  try {
    const items = await prisma.club.findMany({ orderBy: { name: 'asc' } });
    return NextResponse.json({ items }, { status: 200 });
  } catch (error) {
    logger.error('[CLUBS GET]', error);
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
    const club = await prisma.club.create({
      data: { name: parsed.data.name, city: parsed.data.city ?? null },
    });
    return NextResponse.json(club, { status: 201 });
  } catch (error) {
    logger.error('[CLUB POST]', error);
    return reportApiError(error);
  }
}

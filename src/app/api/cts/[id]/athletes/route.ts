import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { reportApiError } from '@/lib/api.logic';

const BodySchema = z.object({ playerId: z.string().min(1) });

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const items = await prisma.playerCT.findMany({ where: { ctId: id } });
    return NextResponse.json({ items }, { status: 200 });
  } catch (error) {
    logger.error('[CT ATHLETES GET]', error);
    return reportApiError(error);
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await request.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.flatten() }, { status: 400 });
    }
    const item = await prisma.playerCT.create({
      data: { ctId: id, playerId: parsed.data.playerId, status: 'ACTIVE' },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    logger.error('[CT ATHLETE POST]', error);
    return reportApiError(error);
  }
}

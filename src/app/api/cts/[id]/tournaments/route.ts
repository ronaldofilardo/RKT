import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { withAccessHandler } from '@/lib/access-handler';
import { logger } from '@/lib/logger';

const TournamentSchema = z.object({ name: z.string().trim().min(2).max(120) });

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: ctId } = await context.params;
  return withAccessHandler(request, 'ct:tournament:manage', () => ({ ctId }), async () => {
    const items = await prisma.tournament.findMany({
      where: { ctId, status: 'ACTIVE' },
      orderBy: { name: 'asc' },
      include: { _count: { select: { matches: true } } },
    });
    return NextResponse.json({ items });
  });
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: ctId } = await context.params;
  return withAccessHandler(request, 'ct:tournament:manage', () => ({ ctId }), async ({ user }) => {
    const body = TournamentSchema.safeParse(await request.json());
    if (!body.success) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', details: body.error.flatten() }, { status: 400 });
    }
    try {
      const item = await prisma.tournament.create({
        data: { ctId, name: body.data.name, createdByUserId: user.id },
      });
      return NextResponse.json(item, { status: 201 });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return NextResponse.json({ error: 'TOURNAMENT_ALREADY_EXISTS' }, { status: 409 });
      }
      logger.error('[CT TOURNAMENT POST]', error);
      return NextResponse.json({ error: 'TOURNAMENT_CREATE_FAILED' }, { status: 500 });
    }
  });
}

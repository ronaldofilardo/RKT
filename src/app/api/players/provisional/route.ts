import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { reportApiError } from '@/lib/api.logic';
import { withAccessHandler } from '@/lib/access-handler';

const BodySchema = z.object({
  name: z.string().min(1).max(120),
});

export async function POST(request: NextRequest) {
  return withAccessHandler(request, 'athlete:create', null, async ({ user }) => {
    try {
      const body = await request.json();
      const parsed = BodySchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.flatten() }, { status: 400 });
      }
      const player = await prisma.player.create({
        data: {
          name: parsed.data.name,
          createdByUserId: user.id,
          identityStatus: 'PROVISIONAL',
        },
      });
      return NextResponse.json(player, { status: 201 });
    } catch (error) {
      logger.error('[PLAYER PROVISIONAL POST]', error);
      return reportApiError(error);
    }
  });
}

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { reportApiError } from '@/lib/api.logic';
import { withAccessHandler } from '@/lib/access-handler';

const BodySchema = z.object({
  guardianUserId: z.string().optional(),
  playerId: z.string().min(1),
  relation: z.string().max(40).optional(),
});

export async function POST(request: NextRequest) {
  return withAccessHandler(request, 'guardian:link', null, async ({ user, actor }) => {
    try {
      const body = await request.json();
      const parsed = BodySchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.flatten() }, { status: 400 });
      }

      const isStaffOrSupport = actor.memberships.some(
        (m) => (m.kind === 'PLATAFORMA' || m.kind === 'GESTOR') && m.status === 'ACTIVE'
      );
      const guardianUserId = isStaffOrSupport && parsed.data.guardianUserId ? parsed.data.guardianUserId : user.id;

      // Auto-confirma se o próprio atleta titular estiver indicando seu responsável
      const player = await prisma.player.findUnique({ where: { id: parsed.data.playerId }, select: { userId: true } });
      const confirmedAt = player?.userId === user.id ? new Date() : null;

      const link = await prisma.guardianLink.create({
        data: {
          guardianUserId,
          playerId: parsed.data.playerId,
          relation: parsed.data.relation ?? null,
          confirmedAt,
        },
      });

      return NextResponse.json(link, { status: 201 });
    } catch (error) {
      logger.error('[GUARDIAN LINK POST]', error);
      return reportApiError(error);
    }
  });
}

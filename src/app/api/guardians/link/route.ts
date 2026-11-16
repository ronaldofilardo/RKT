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

      const isGestor = actor.memberships.some(
        (m) => m.kind === 'GESTOR' && m.status === 'ACTIVE'
      );
      const guardianUserId = isGestor && parsed.data.guardianUserId ? parsed.data.guardianUserId : user.id;

      const player = await prisma.player.findUnique({ where: { id: parsed.data.playerId }, select: { userId: true } });
      if (player?.userId && player.userId === guardianUserId) {
        return NextResponse.json({ error: 'FORBIDDEN', message: 'O atleta não pode ser responsável por si mesmo' }, { status: 403 });
      }

      // Vínculo nasce sempre pendente de confirmação pelo responsável legal
      const link = await prisma.guardianLink.create({
        data: {
          guardianUserId,
          playerId: parsed.data.playerId,
          relation: parsed.data.relation ?? null,
          confirmedAt: null,
        },
      });

      return NextResponse.json(link, { status: 201 });
    } catch (error) {
      logger.error('[GUARDIAN LINK POST]', error);
      return reportApiError(error);
    }
  });
}

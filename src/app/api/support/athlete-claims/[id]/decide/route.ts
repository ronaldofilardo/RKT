import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { reportApiError } from '@/lib/api.logic';
import { withAccessHandler } from '@/lib/access-handler';

const BodySchema = z.object({ status: z.enum(['APPROVED', 'REJECTED']) });

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return withAccessHandler(request, 'support:account:assist', null, async ({ user }) => {
    try {
      const body = await request.json();
      const parsed = BodySchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.flatten() }, { status: 400 });
      }

      const existing = await prisma.athleteClaim.findUnique({ where: { id } });
      if (!existing || existing.status !== 'PENDING') {
        return NextResponse.json({ error: 'CLAIM_NOT_FOUND', message: 'Reivindicação inexistente ou já decidida' }, { status: 404 });
      }

      const claim = await prisma.athleteClaim.update({
        where: { id },
        data: { status: parsed.data.status, decidedByUserId: user.id },
      });

      if (parsed.data.status === 'APPROVED') {
        await prisma.player.update({
          where: { id: claim.playerId },
          data: { userId: claim.userId },
        });
      }

      await prisma.auditLog.create({
        data: {
          actorUserId: user.id,
          action: `ATHLETE_CLAIM_${parsed.data.status}`,
          resourceType: 'AthleteClaim',
          resourceId: id,
        },
      });

      return NextResponse.json(claim, { status: 200 });
    } catch (error) {
      logger.error('[ATHLETE CLAIM DECIDE POST]', error);
      return reportApiError(error);
    }
  });
}


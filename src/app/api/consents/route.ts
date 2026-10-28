import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { reportApiError } from '@/lib/api.logic';
import { withAccessHandler } from '@/lib/access-handler';

const BodySchema = z.object({
  playerId: z.string().min(1),
  termsVersion: z.string().min(1),
});

export async function POST(request: NextRequest) {
  return withAccessHandler(request, 'guardian:link', null, async ({ user, actor }) => {
    try {
      const body = await request.json();
      const parsed = BodySchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.flatten() }, { status: 400 });
      }

      const isConfirmedGuardian = actor.guardianOfPlayerIds.includes(parsed.data.playerId);
      const isSupport = actor.memberships.some(
        (m) => m.kind === 'PLATAFORMA' && m.status === 'ACTIVE'
      );

      if (!isConfirmedGuardian && !isSupport) {
        return NextResponse.json({ error: 'FORBIDDEN', message: 'Usuário não é responsável confirmado deste atleta' }, { status: 403 });
      }

      const record = await prisma.consentRecord.create({
        data: {
          guardianUserId: user.id,
          playerId: parsed.data.playerId,
          purpose: 'DATA',
          termsVersion: parsed.data.termsVersion,
          grantedAt: new Date(),
        },
      });
      return NextResponse.json(record, { status: 201 });
    } catch (error) {
      logger.error('[CONSENT POST]', error);
      return reportApiError(error);
    }
  });
}

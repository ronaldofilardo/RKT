import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { reportApiError } from '@/lib/api.logic';
import { withAccessHandler } from '@/lib/access-handler';
import { isMinor } from '@/core/access/age';

const BodySchema = z.object({
  playerId: z.string().min(1),
  purpose: z.enum(['DATA', 'BROADCAST']),
  action: z.enum(['grant', 'revoke']),
  termsVersion: z.string().min(1).optional(),
});

export async function POST(request: NextRequest) {
  return withAccessHandler(request, null, null, async ({ user }) => {
    try {
      const body = await request.json();
      const parsed = BodySchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.flatten() }, { status: 400 });
      }

      const { playerId, purpose, action, termsVersion } = parsed.data;

      // O responsável deve ter vínculo ativo confirmado com o atleta
      const link = await prisma.guardianLink.findFirst({
        where: { guardianUserId: user.id, playerId, confirmedAt: { not: null }, revokedAt: null },
        include: { player: { select: { birthDate: true, userId: true } } },
      });
      if (!link) {
        return NextResponse.json({ error: 'FORBIDDEN', message: 'Vínculo de tutela não confirmado ou inexistente' }, { status: 403 });
      }

      // O atleta deve ser menor (tutela só se aplica a menores)
      if (!isMinor(link.player.birthDate ?? null, new Date())) {
        return NextResponse.json({ error: 'FORBIDDEN', message: 'Consentimento de tutela só aplica a menores de 18 anos' }, { status: 403 });
      }

      // O próprio atleta não pode consentir por si mesmo
      if (link.player.userId === user.id) {
        return NextResponse.json({ error: 'FORBIDDEN', message: 'O atleta não pode autorizar seu próprio responsável' }, { status: 403 });
      }

      const ipHash = Buffer.from(request.headers.get('x-forwarded-for') || 'unknown').toString('base64');

      if (action === 'revoke') {
        await prisma.consentRecord.updateMany({
          where: { guardianUserId: user.id, playerId, purpose, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      } else {
        const existing = await prisma.consentRecord.findFirst({
          where: { guardianUserId: user.id, playerId, purpose },
        });
        if (existing) {
          await prisma.consentRecord.update({
            where: { id: existing.id },
            data: {
              revokedAt: null,
              grantedAt: new Date(),
              termsVersion: termsVersion ?? '1.0',
              ipHash,
            },
          });
        } else {
          await prisma.consentRecord.create({
            data: {
              guardianUserId: user.id,
              playerId,
              purpose,
              termsVersion: termsVersion ?? '1.0',
              grantedAt: new Date(),
              ipHash,
            },
          });
        }
      }

      await prisma.auditLog.create({
        data: {
          actorUserId: user.id,
          action: action === 'grant' ? 'CONSENT_GRANTED' : 'CONSENT_REVOKED',
          resourceType: 'ConsentRecord',
          resourceId: playerId,
          meta: { purpose, termsVersion },
          ipHash,
        },
      });

      return NextResponse.json({ ok: true, playerId, purpose, action }, { status: 200 });
    } catch (error) {
      logger.error('[GUARDIAN CONSENT POST]', error);
      return reportApiError(error);
    }
  });
}

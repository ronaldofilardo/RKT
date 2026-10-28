import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createHash } from 'crypto';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { reportApiError } from '@/lib/api.logic';
import { withAccessHandler } from '@/lib/access-handler';
import { getGestorCtId, denyGestor } from '../_logic';

const InviteSchema = z.object({
  email: z.string().email('E-mail inválido'),
  expiresInDays: z.coerce.number().int().min(1).max(30).default(7),
});

export async function POST(request: NextRequest) {
  const ctId = await getGestorCtId(request);
  if (!ctId) return denyGestor('Gestor não encontrado');

  return withAccessHandler(request, 'platform:memberships:manage', () => ({ ctId }), async ({ user }) => {
    try {
      const body = await request.json().catch(() => null);
      const parsed = InviteSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.flatten() }, { status: 400 });
      }

      const { email, expiresInDays } = parsed.data;
      const token = Buffer.from(`${ctId}:${email}:${Date.now()}`).toString('base64url');
      const tokenHash = createHash('sha256').update(token).digest('hex');
      const codeHash = createHash('sha256').update(Math.floor(100000 + Math.random() * 900000).toString()).digest('hex');
      const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

      const invite = await prisma.linkInvite.create({
        data: {
          ctId,
          kind: 'GESTOR',
          tokenHash,
          codeHash,
          createdByUserId: user.id,
          expiresAt,
          maxUses: 1,
        },
      });

      return NextResponse.json({
        message: 'Convite de co-gestor criado.',
        token,
        inviteId: invite.id,
        expiresAt,
      }, { status: 201 });
    } catch (error) {
      logger.error('[GESTOR INVITES POST]', error);
      return reportApiError(error);
    }
  });
}

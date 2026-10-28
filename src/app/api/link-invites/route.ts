import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { randomBytes, createHash } from 'crypto';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { reportApiError } from '@/lib/api.logic';
import { withAccessHandler } from '@/lib/access-handler';

const BodySchema = z.object({
  ctId: z.string().min(1),
  kind: z.enum(['TREINADOR', 'ATLETA', 'GESTOR']),
  expiresInDays: z.number().int().min(1).max(30).default(7),
});

export async function GET(request: NextRequest) {
  const ctId = request.nextUrl.searchParams.get('ctId') ?? undefined;
  return withAccessHandler(request, 'ct:members:manage', () => ({ ctId }), async ({ actor }) => {
    try {
      const isPlatformAdmin = actor.memberships.some((m) => m.kind === 'PLATAFORMA' && m.preset === 'ADMIN');
      const managedCtIds = actor.memberships
        .filter((m) => m.kind === 'GESTOR' && m.status === 'ACTIVE' && m.ctId)
        .map((m) => m.ctId as string);

      const whereClause = isPlatformAdmin
        ? (ctId ? { ctId } : {})
        : { ctId: ctId && managedCtIds.includes(ctId) ? ctId : { in: managedCtIds } };

      const items = await prisma.linkInvite.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
      return NextResponse.json({ items }, { status: 200 });
    } catch (error) {
      logger.error('[LINK INVITES GET]', error);
      return reportApiError(error);
    }
  });
}

export async function POST(request: NextRequest) {
  const body = await request.clone().json().catch(() => ({}));
  const ctId = typeof body?.ctId === 'string' ? body.ctId : undefined;

  return withAccessHandler(request, 'ct:members:manage', () => ({ ctId }), async ({ user, actor }) => {
    try {
      const parsed = BodySchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.flatten() }, { status: 400 });
      }

      if (parsed.data.kind === 'GESTOR') {
        const isPlatformAdmin = actor.memberships.some((m) => m.kind === 'PLATAFORMA' && m.preset === 'ADMIN');
        const isCtGestor = actor.memberships.some(
          (m) => m.kind === 'GESTOR' && m.ctId === parsed.data.ctId && m.status === 'ACTIVE'
        );
        if (!isPlatformAdmin && !isCtGestor) {
          return NextResponse.json({ error: 'FORBIDDEN', message: 'Apenas gestor do CT ou admin pode convidar novo gestor' }, { status: 403 });
        }
      }

      const token = randomBytes(32).toString('hex');
      const code = randomBytes(4).toString('hex').toUpperCase();
      const tokenHash = createHash('sha256').update(token).digest('hex');
      const codeHash = createHash('sha256').update(code).digest('hex');
      const expiresAt = new Date(Date.now() + parsed.data.expiresInDays * 24 * 60 * 60 * 1000);

      const invite = await prisma.linkInvite.create({
        data: {
          ctId: parsed.data.ctId,
          kind: parsed.data.kind,
          tokenHash,
          codeHash,
          createdByUserId: user.id,
          expiresAt,
          maxUses: 1,
        },
      });

      return NextResponse.json({ id: invite.id, token, code, expiresAt }, { status: 201 });
    } catch (error) {
      logger.error('[LINK INVITE POST]', error);
      return reportApiError(error);
    }
  });
}

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { reportApiError } from '@/lib/api.logic';
import { withAccessHandler } from '@/lib/access-handler';
import { can, activeCtIds, getProfiles, type Resource } from '@/core/access';

const BodySchema = z.object({
  userId: z.string().min(1),
  kind: z.enum(['PLATAFORMA', 'GESTOR', 'TREINADOR']),
  ctId: z.string().optional(),
  preset: z.enum(['ADMIN', 'SUPORTE']).optional(),
});

export async function GET(request: NextRequest) {
  return withAccessHandler(request, 'platform:memberships:manage', null, async ({ actor }) => {
    try {
      const isPlatform = getProfiles(actor).some((p) => p === 'ADMIN' || p === 'SUPORTE');
      const ctIds = activeCtIds(actor, 'GESTOR');
      const where = isPlatform ? {} : { ctId: { in: ctIds } };
      const items = await prisma.membership.findMany({ where, orderBy: { createdAt: 'desc' }, take: 200 });
      return NextResponse.json({ items }, { status: 200 });
    } catch (error) {
      logger.error('[MEMBERSHIPS GET]', error);
      return reportApiError(error);
    }
  });
}

export async function POST(request: NextRequest) {
  return withAccessHandler(request, 'platform:memberships:manage', null, async ({ user, actor }) => {
    try {
      const body = await request.json();
      const parsed = BodySchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.flatten() }, { status: 400 });
      }

      const isPlatformKind = parsed.data.kind === 'PLATAFORMA';
      const resource: Resource = { ctId: parsed.data.ctId, targetsPlatform: isPlatformKind };
      const action = isPlatformKind ? 'platform:memberships:manage' : 'ct:members:manage';
      const decision = can(actor, action, resource);
      if (!decision.allow) {
        return NextResponse.json({ error: 'FORBIDDEN', message: 'Sem permissão para este tipo ou CT' }, { status: 403 });
      }

      const m = await prisma.membership.create({
        data: {
          userId: parsed.data.userId,
          kind: parsed.data.kind,
          ctId: parsed.data.ctId,
          preset: parsed.data.preset,
          status: 'ACTIVE',
        },
      });

      await prisma.auditLog.create({
        data: {
          actorUserId: user.id,
          action: `MEMBERSHIP_CREATED_${parsed.data.kind}`,
          resourceType: 'Membership',
          resourceId: m.id,
        },
      });

      return NextResponse.json(m, { status: 201 });
    } catch (error) {
      logger.error('[MEMBERSHIP POST]', error);
      return reportApiError(error);
    }
  });
}


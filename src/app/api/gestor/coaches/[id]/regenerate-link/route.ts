import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { flexibleIdValidator } from '@/schemas/common';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { reportApiError } from '@/lib/api.logic';
import { withAccessHandler } from '@/lib/access-handler';
import { getGestorCtId, denyGestor } from '../../../_logic';
import { issueCoachLink } from './regenerate-link-issue.logic';

const ParamsSchema = z.object({ id: flexibleIdValidator });

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const parsedParams = ParamsSchema.safeParse(await params);
  if (!parsedParams.success) {
    return NextResponse.json({ error: 'VALIDATION_ERROR', message: 'ID de treinador inválido', details: parsedParams.error.flatten() }, { status: 400 });
  }
  const ctId = await getGestorCtId(request);
  if (!ctId) return denyGestor('Gestor não encontrado');

  return withAccessHandler(
    request,
    'platform:memberships:manage',
    () => ({ ctId }),
    async () => {
      try {
        const { id } = await params;
        const membership = await prisma.membership.findFirst({
          where: { OR: [{ id }, { userId: id }], kind: 'TREINADOR', ctId, status: 'ACTIVE' },
          include: { user: true },
        });
        if (!membership) {
          return NextResponse.json(
            { error: 'NOT_FOUND', message: 'Vínculo de treinador não encontrado' },
            { status: 404 },
          );
        }

        const { token, expiresAt } = await issueCoachLink({
          ctId,
          userId: membership.userId,
          userEmail: membership.user.email ?? null,
        });

        return NextResponse.json({
          message: 'Link de acesso regenerado.',
          token,
          expiresAt,
        });
      } catch (error) {
        logger.error('[COACH REGENERATE LINK]', error);
        return reportApiError(error);
      }
    },
  );
}

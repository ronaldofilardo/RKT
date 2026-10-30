import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { reportApiError } from '@/lib/api.logic';
import { withAccessHandler } from '@/lib/access-handler';
import { getGestorCtId, denyGestor } from '../_logic';

export async function GET(request: NextRequest) {
  const ctId = await getGestorCtId(request);
  if (!ctId) return denyGestor('Gestor não encontrado');

  return withAccessHandler(request, 'platform:memberships:manage', () => ({ ctId }), async () => {
    try {
      const clubs = await prisma.trainingCenter.findMany({
        where: {
          id: ctId,
        },
        select: {
          id: true,
          name: true,
          status: true,
          cnpj: true,
          email: true,
          createdAt: true,
        },
      });

      return NextResponse.json({ items: clubs }, { status: 200 });
    } catch (error) {
      logger.error('[GESTOR-CLUBS GET]', error);
      return reportApiError(error);
    }
  });
}

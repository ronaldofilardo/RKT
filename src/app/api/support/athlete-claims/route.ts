import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { reportApiError } from '@/lib/api.logic';
import { withAccessHandler } from '@/lib/access-handler';

export async function GET(request: NextRequest) {
  return withAccessHandler(request, 'support:account:assist', null, async () => {
    try {
      const items = await prisma.athleteClaim.findMany({
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'asc' },
        include: {
          user: { select: { id: true, name: true, email: true } },
          player: { select: { id: true, name: true, birthDate: true } },
        },
      });
      return NextResponse.json({ items }, { status: 200 });
    } catch (error) {
      logger.error('[SUPPORT ATHLETE CLAIMS GET]', error);
      return reportApiError(error);
    }
  });
}


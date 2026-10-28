import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { reportApiError } from '@/lib/api.logic';
import { withAccessHandler } from '@/lib/access-handler';

export async function GET(request: NextRequest) {
  return withAccessHandler(request, 'platform:users:manage', null, async () => {
    try {
      const items = await prisma.user.findMany({
        select: { id: true, name: true, email: true, cpf: true, role: true, canOperate: true, isActive: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 200,
      });
      return NextResponse.json({ items }, { status: 200 });
    } catch (error) {
      logger.error('[USERS GET]', error);
      return reportApiError(error);
    }
  });
}

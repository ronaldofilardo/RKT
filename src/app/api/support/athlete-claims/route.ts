import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { reportApiError } from '@/lib/api.logic';

export async function GET(_request: NextRequest) {
  try {
    const items = await prisma.athleteClaim.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json({ items }, { status: 200 });
  } catch (error) {
    logger.error('[SUPPORT ATHLETE CLAIMS GET]', error);
    return reportApiError(error);
  }
}

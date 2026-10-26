import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { reportApiError } from '@/lib/api.logic';

export async function GET(_request: NextRequest) {
  try {
    const items = await prisma.passwordResetRequest.findMany({
      where: { status: 'PENDING' },
      orderBy: { requestedAt: 'asc' },
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
    });
    return NextResponse.json({ items }, { status: 200 });
  } catch (error) {
    logger.error('[SUPPORT PASSWORD RESETS GET]', error);
    return reportApiError(error);
  }
}

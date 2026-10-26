import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { reportApiError } from '@/lib/api.logic';

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const user = await prisma.user.update({
      where: { id },
      data: { sessionVersion: { increment: 1 } },
    });
    return NextResponse.json({ id: user.id, sessionVersion: user.sessionVersion }, { status: 200 });
  } catch (error) {
    logger.error('[USER REVOKE SESSIONS POST]', error);
    return reportApiError(error);
  }
}

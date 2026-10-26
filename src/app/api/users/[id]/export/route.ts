import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { reportApiError } from '@/lib/api.logic';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: { memberships: true },
    });
    if (!user) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    logger.error('[USER EXPORT GET]', error);
    return reportApiError(error);
  }
}

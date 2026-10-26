import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { reportApiError } from '@/lib/api.logic';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const items = await prisma.membership.findMany({ where: { userId: id } });
    return NextResponse.json({ items }, { status: 200 });
  } catch (error) {
    logger.error('[USER MEMBERSHIPS GET]', error);
    return reportApiError(error);
  }
}

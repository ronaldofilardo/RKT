import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { reportApiError } from '@/lib/api.logic';

export async function GET(request: NextRequest) {
  try {
    const search = request.nextUrl.searchParams.get('search')?.trim() ?? '';
    const where = search.length >= 3 ? { name: { contains: search, mode: 'insensitive' as const } } : {};
    const items = await prisma.player.findMany({ where, take: 50, orderBy: { name: 'asc' } });
    return NextResponse.json({ items }, { status: 200 });
  } catch (error) {
    logger.error('[PLAYERS GET]', error);
    return reportApiError(error);
  }
}

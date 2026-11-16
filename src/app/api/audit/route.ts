import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { reportApiError } from '@/lib/api.logic';
import { withAccessHandler } from '@/lib/access-handler';

export async function GET(request: NextRequest) {
  return withAccessHandler(request, 'audit:read', null, async () => {
    try {
      const items = await prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });
      return NextResponse.json({ items }, { status: 200 });
    } catch (error) {
      logger.error('[AUDIT GET]', error);
      return reportApiError(error);
    }
  });
}

export async function POST() {
  return NextResponse.json(
    { error: 'FORBIDDEN', message: 'Criação direta de logs de auditoria via API externa é proibida.' },
    { status: 403 },
  );
}

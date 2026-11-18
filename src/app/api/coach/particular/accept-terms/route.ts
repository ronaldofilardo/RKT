import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-credentials.logic';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const auth = await getUserFromRequest(request);
    if (!auth?.id) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

    const userAgent = request.headers.get('user-agent') ?? 'unknown';
    await prisma.auditLog.create({
      data: {
        actorUserId: auth.id,
        action: 'COACH_ECA_TERMS_ACCEPTED',
        resourceType: 'User',
        resourceId: auth.id,
        meta: {
          termsVersion: '2.0',
          law: 'ECA Digital (Lei 15.211/2025) & LGPD Art. 14',
          userAgent,
          acceptedAt: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({ success: true, acceptedAt: new Date().toISOString() });
  } catch (err) {
    logger.error('[COACH ECA TERMS] Falha ao registrar aceite:', err);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

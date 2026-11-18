import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-credentials.logic';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const auth = await getUserFromRequest(request);
    if (!auth?.id) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

    const acceptedLog = await prisma.auditLog.findFirst({
      where: {
        actorUserId: auth.id,
        action: 'COACH_ECA_TERMS_ACCEPTED',
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true, createdAt: true },
    });

    return NextResponse.json({
      accepted: Boolean(acceptedLog),
      acceptedAt: acceptedLog?.createdAt ?? null,
    });
  } catch {
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

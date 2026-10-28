import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { reportApiError } from '@/lib/api.logic';
import { withAccessHandler } from '@/lib/access-handler';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return withAccessHandler(request, 'guardian:link', null, async ({ user, actor }) => {
    try {
      const record = await prisma.consentRecord.findUnique({ where: { id } });
      if (!record) {
        return NextResponse.json({ error: 'NOT_FOUND', message: 'Consentimento não encontrado' }, { status: 404 });
      }

      const isGrantor = record.guardianUserId === user.id;
      const isPlatformStaff = actor.memberships.some(
        (m) => m.kind === 'PLATAFORMA' && m.status === 'ACTIVE'
      );

      if (!isGrantor && !isPlatformStaff) {
        return NextResponse.json({ error: 'FORBIDDEN', message: 'Apenas o outorgante ou suporte pode revogar' }, { status: 403 });
      }

      const updated = await prisma.consentRecord.update({
        where: { id },
        data: { revokedAt: new Date() },
      });
      return NextResponse.json(updated, { status: 200 });
    } catch (error) {
      logger.error('[CONSENT PATCH]', error);
      return reportApiError(error);
    }
  });
}

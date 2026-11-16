import { NextRequest, NextResponse } from 'next/server';
import { withAccessHandler } from '@/lib/access-handler';
import { prisma } from '@/lib/prisma';
import { reportApiError } from '@/lib/api.logic';

export async function POST(request: NextRequest) {
  return withAccessHandler(request, null, null, async ({ user }) => {
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: { canOperate: true },
      });

      const ipHash = Buffer.from(request.headers.get('x-forwarded-for') || 'local').toString('base64');
      await prisma.auditLog.create({
        data: {
          actorUserId: user.id,
          action: 'GUARDIAN_UPGRADED_TO_SPECTATOR',
          resourceType: 'User',
          resourceId: user.id,
          meta: { upgradedAt: new Date().toISOString() },
          ipHash,
        },
      });

      return NextResponse.json({
        ok: true,
        canOperate: true,
        message: 'Upgrade para Conta de Espectador e Anotador concluído com sucesso.',
      });
    } catch (error) {
      return reportApiError(error);
    }
  });
}

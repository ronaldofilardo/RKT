import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { reportApiError } from '@/lib/api.logic';
import { withAccessHandler } from '@/lib/access-handler';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return withAccessHandler(request, null, null, async ({ user }) => {
    try {
      const link = await prisma.guardianLink.findUnique({
        where: { id },
        include: { player: { select: { userId: true } } },
      });
      if (!link) {
        return NextResponse.json({ error: 'NOT_FOUND', message: 'Vínculo não encontrado' }, { status: 404 });
      }

      if (link.player.userId && link.player.userId === user.id) {
        return NextResponse.json({ error: 'FORBIDDEN', message: 'O atleta não pode confirmar o próprio vínculo' }, { status: 403 });
      }

      if (link.guardianUserId !== user.id) {
        return NextResponse.json({ error: 'FORBIDDEN', message: 'Apenas o responsável indicado pode confirmar' }, { status: 403 });
      }

      const updated = await prisma.guardianLink.update({
        where: { id },
        data: { confirmedAt: new Date() },
      });

      return NextResponse.json(updated, { status: 200 });
    } catch (error) {
      logger.error('[GUARDIAN LINK CONFIRM POST]', error);
      return reportApiError(error);
    }
  });
}

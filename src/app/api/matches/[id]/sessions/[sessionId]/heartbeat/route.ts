import { NextRequest, NextResponse } from 'next/server';
import { withAccessHandler } from '@/lib/access-handler';
import { prisma } from '@/lib/prisma';
import { SessionPathParamsSchema } from '@/schemas/comment';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  return withAccessHandler(request, null, null, async ({ user }) => {
    const parsedParams = SessionPathParamsSchema.safeParse(await params);
    if (!parsedParams.success) return NextResponse.json({ error: 'INVALID_PARAMS' }, { status: 400 });
    const { id: matchId, sessionId } = parsedParams.data;

    const session = await prisma.matchAnnotationSession.findFirst({
      where: { id: sessionId, matchId, annotatorUserId: user.id, isActive: true },
      select: { id: true, lastHeartbeatAt: true },
    });

    if (!session) {
      return NextResponse.json({ error: 'SESSION_NOT_FOUND', message: 'Sessão ativa não encontrada' }, { status: 404 });
    }

    const now = new Date();
    // Throttle de 15 segundos para evitar escritas excessivas no Postgres
    if (!session.lastHeartbeatAt || now.getTime() - session.lastHeartbeatAt.getTime() > 15_000) {
      await prisma.matchAnnotationSession.update({
        where: { id: session.id },
        data: { lastHeartbeatAt: now },
      });
    }

    return NextResponse.json({ success: true, timestamp: now.toISOString() });
  });
}


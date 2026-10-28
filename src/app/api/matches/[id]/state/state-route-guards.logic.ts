import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { emitMatchEvent } from '@/lib/match-events';

export async function checkCanModifyMatchState(
  match: {
    player1Id: string;
    player2Id: string;
    player1PartnerId?: string | null;
    player2PartnerId?: string | null;
    createdByUserId?: string | null;
    openForAnnotation?: boolean | null;
  },
  matchId: string,
  user?: { id?: string; role?: string } | null,
  athletePlayerId?: string | null,
): Promise<boolean> {
  const currentUserId = user?.id;
  const isStaff = user?.role === 'ADMIN';
  const isParticipant =
    match.player1Id === athletePlayerId ||
    match.player2Id === athletePlayerId ||
    match.player1PartnerId === athletePlayerId ||
    match.player2PartnerId === athletePlayerId ||
    match.createdByUserId === currentUserId;

  if (isStaff || isParticipant) {
    return true;
  }

  // Falha fechada: se o modelo de sessão não estiver disponível, nega o acesso.
  const prismaWithSessions = prisma as unknown as {
    matchAnnotationSession?: {
      findFirst: (args: {
        where: { matchId?: string; isActive: boolean; annotatorUserId?: string };
      }) => Promise<unknown>;
    };
  };
  const sessionModel = prismaWithSessions.matchAnnotationSession;
  if (typeof sessionModel?.findFirst !== 'function') return false;

  const activeSession = await sessionModel.findFirst({
    where: { matchId, isActive: true, annotatorUserId: currentUserId },
  });
  return Boolean(activeSession);
}

export async function reportTransitionFailure(
  resultError: string | undefined,
  matchId: string,
  expectedVersion?: number,
): Promise<NextResponse> {
  if (resultError === 'VERSION_CONFLICT') {
    const current = await prisma.match.findUnique({
      where: { id: matchId },
      select: { version: true },
    });
    return NextResponse.json(
      {
        error: 'VERSION_CONFLICT',
        message: 'Estado desatualizado. Outra atualização ocorreu simultaneamente.',
        currentVersion: current?.version,
        expectedVersion,
      },
      { status: 409 },
    );
  }
  return NextResponse.json({ error: resultError || 'TRANSITION_ERROR' }, { status: 422 });
}

export function emitStateEvents(id: string, voidPointLogId?: string, scoreState?: unknown): void {
  if (voidPointLogId) {
    emitMatchEvent(id, 'state_changed', { action: 'point_voided', pointId: voidPointLogId });
  }
  emitMatchEvent(id, 'state_changed', { action: 'state_patch', scoreState });
}

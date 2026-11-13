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
    isTemplate?: boolean | null;
  },
  _matchId: string,
  user?: { id?: string; role?: string } | null,
  _athletePlayerId?: string | null,
): Promise<boolean> {
  if (match.isTemplate) return false;
  const currentUserId = user?.id;
  if (!currentUserId || !match.createdByUserId) return false;
  return match.createdByUserId === currentUserId;
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

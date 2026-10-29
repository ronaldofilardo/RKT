import { NextRequest, NextResponse } from 'next/server';
import { canWatchMatch, type MatchAccess } from '@/core/access';
import { prisma } from '@/lib/prisma';
import { getAccessUserFromRequest } from '@/lib/auth-credentials.logic';
import { getActor } from '@/services/accessService';
import { hasActiveSpectatorConcession, isGuestSpectatorAuthorized } from '@/services/spectator-concession.service';
import { getSpectatorFeed } from '@/services/spectator-feed.service';

async function resolveMatchAccess(matchId: string): Promise<MatchAccess | null> {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: {
      createdByUserId: true,
      ctId: true,
      player1Id: true,
      player2Id: true,
      player1PartnerId: true,
      player2PartnerId: true,
      annotationSessions: { where: { isActive: true }, select: { annotatorUserId: true } },
    },
  });
  if (!match) return null;

  const participantPlayerIds = [match.player1Id, match.player2Id, match.player1PartnerId, match.player2PartnerId].filter(
    (id): id is string => Boolean(id)
  );

  return {
    createdByUserId: match.createdByUserId,
    ctId: match.ctId,
    annotatorUserIds: match.annotationSessions.map((s) => s.annotatorUserId),
    participantPlayerIds,
    participantCtIds: [],
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const { matchId } = await params;
  const clientRev = request.nextUrl.searchParams.get('rev') || undefined;

  // 1. Acesso via Concessão de Convidado (Cookie HTTP-only ou Token)
  const guestToken = request.cookies.get(`rkt_spectator_${matchId}`)?.value || request.nextUrl.searchParams.get('token');
  if (guestToken) {
    const isGuestAuthorized = await isGuestSpectatorAuthorized(matchId, guestToken);
    if (isGuestAuthorized) {
      const feed = await getSpectatorFeed({ matchId, clientRev, guardianPlayerIds: [] });
      if (!feed.ok) return NextResponse.json({ error: feed.error }, { status: feed.status });
      return NextResponse.json(feed, { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
    }
  }

  // 2. Acesso via Usuário Autenticado
  const user = await getAccessUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'FORBIDDEN', message: 'Acesso não autorizado' }, { status: 403 });
  }

  const matchAccess = await resolveMatchAccess(matchId);
  if (!matchAccess) {
    return NextResponse.json({ error: 'MATCH_NOT_FOUND' }, { status: 404 });
  }

  const actor = await getActor(user.id);
  const isSpectatorGranted = await hasActiveSpectatorConcession(matchId, user.id);
  const authorized = actor && canWatchMatch(actor, matchAccess, isSpectatorGranted);

  if (!authorized) {
    return NextResponse.json({ error: 'FORBIDDEN', message: 'Você não tem permissão para acompanhar esta partida' }, { status: 403 });
  }

  const feed = await getSpectatorFeed({
    matchId,
    clientRev,
    guardianPlayerIds: actor?.guardianOfPlayerIds,
  });

  if (!feed.ok) return NextResponse.json({ error: feed.error }, { status: feed.status });
  return NextResponse.json(feed, { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
}

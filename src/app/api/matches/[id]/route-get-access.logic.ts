import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  canDiscoverMatchTemplate,
  canReadMatch,
  type Actor,
  type MatchAccess,
} from '@/core/access';

export interface LoadedMatchForGet {
  id: string;
  player1Id: string;
  player2Id: string;
  player1PartnerId?: string | null;
  player2PartnerId?: string | null;
  createdByUserId?: string | null;
  ctId?: string | null;
  isTemplate?: boolean;
  isPublicTemplate?: boolean;
  eventScope?: 'PUBLIC' | 'PRIVATE_CLUB' | 'PRIVATE_COACH' | 'PRIVATE_PLAYERS' | 'PRIVATE_PERSONAL';
  isOfficialClubAnnotation?: boolean;
  annotationSessions?: Array<{ annotatorUserId: string }>;
}

export async function resolveGetMatchAccess(
  actor: Actor,
  match: LoadedMatchForGet,
): Promise<{ ok: true; isTemplate: boolean; myAnnotationId?: string | null } | { ok: false; response: NextResponse }> {
  const participantPlayerIds = [
    match.player1Id,
    match.player2Id,
    match.player1PartnerId,
    match.player2PartnerId,
  ].filter(Boolean) as string[];

  if (match.isTemplate || match.isPublicTemplate) {
    const scope = match.eventScope ?? (match.isPublicTemplate ? 'PUBLIC' : 'PRIVATE_PERSONAL');
    const canDiscover = canDiscoverMatchTemplate(actor, {
      eventScope: scope,
      createdByUserId: match.createdByUserId,
      ctId: match.ctId,
      participantPlayerIds,
    });
    if (!canDiscover) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: 'FORBIDDEN', message: 'Você não tem acesso a este cartaz' },
          { status: 403 },
        ),
      };
    }
    const existing = prisma.match.findFirst
      ? await prisma.match.findFirst({
          where: {
            sourceMatchId: match.id,
            createdByUserId: actor.userId,
            deletedAt: null,
            state: { not: 'CANCELLED' },
          },
          select: { id: true },
        })
      : null;
    return { ok: true, isTemplate: true, myAnnotationId: existing?.id ?? null };
  }

  let participantCtIds: string[] = [];
  if (match.ctId && prisma.playerCT?.findMany) {
    const raw = await prisma.playerCT.findMany({
      where: { playerId: { in: participantPlayerIds }, status: 'ACTIVE', ctId: match.ctId },
      select: { ctId: true },
    });
    const playerCts = Array.isArray(raw) ? raw : [];
    participantCtIds = [...new Set(playerCts.map((pc) => pc.ctId))];
  }

  const matchAccess: MatchAccess = {
    createdByUserId: match.createdByUserId ?? undefined,
    ctId: match.ctId ?? undefined,
    isTemplate: false,
    isOfficialClubAnnotation: Boolean(match.isOfficialClubAnnotation),
    annotatorUserIds: (match.annotationSessions ?? []).map((s) => s.annotatorUserId),
    participantPlayerIds,
    participantCtIds,
  };

  if (!canReadMatch(actor, matchAccess)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'FORBIDDEN', message: 'Você não tem acesso a esta partida' },
        { status: 403 },
      ),
    };
  }

  return { ok: true, isTemplate: false };
}


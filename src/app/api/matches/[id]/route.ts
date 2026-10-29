import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAccessHandler } from '@/lib/access-handler';
import { canReadMatch, type MatchAccess } from '@/core/access';
import { MATCH_SELECT } from './route-match-select';
import { fetchMatchPointExtras } from './route-get-extras.queries';
import { handleMatchPut } from './route-put.logic';
import { handleMatchDelete } from './route-delete.logic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAccessHandler(request, null, null, async ({ actor }) => {
    const { id } = await params;
    const match = await prisma.match.findFirst({
      where: { id, deletedAt: null },
      select: {
        ...MATCH_SELECT,
        annotationSessions: {
          select: { annotatorUserId: true },
        },
      },
    });

    if (!match) {
      return NextResponse.json({ error: 'MATCH_NOT_FOUND' }, { status: 404 });
    }

    const participantPlayerIds = [
      match.player1Id,
      match.player2Id,
      match.player1PartnerId,
      match.player2PartnerId,
    ].filter(Boolean) as string[];

    const annotatorUserIds = (match.annotationSessions ?? []).map((s) => s.annotatorUserId);

    let participantCtIds: string[] = [];
    if (match.ctId) {
      const findMany = prisma.playerCT?.findMany;
      const playerCtsRaw = findMany
        ? await findMany({
            where: {
              playerId: { in: participantPlayerIds },
              status: 'ACTIVE',
              ctId: match.ctId,
            },
            select: { ctId: true },
          })
        : [];
      const playerCts = Array.isArray(playerCtsRaw) ? playerCtsRaw : [];
      participantCtIds = [...new Set(playerCts.map((pc) => pc.ctId))];
    }

    const matchAccess: MatchAccess = {
      createdByUserId: match.createdByUserId ?? undefined,
      ctId: match.ctId ?? undefined,
      annotatorUserIds,
      participantPlayerIds,
      participantCtIds,
    };

    if (!canReadMatch(actor, matchAccess)) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Você não tem acesso a esta partida' },
        { status: 403 }
      );
    }

    const extras = await fetchMatchPointExtras(id);

    return NextResponse.json({ ...match, ...extras });
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAccessHandler(request, 'match:annotate', null, async ({ user }) => {
    const { id } = await params;
    return handleMatchPut(request, user.id, id);
  });
}

export const PATCH = PUT;

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAccessHandler(request, 'match:annotate', null, async ({ user }) => {
    const { id } = await params;
    return handleMatchDelete(request, user.id, id);
  });
}

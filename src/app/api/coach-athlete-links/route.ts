import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { withAccessHandler } from '@/lib/access-handler';
import { getProfiles } from '@/core/access';

const RequestSchema = z.object({ playerId: z.string().min(1) });

export async function GET(request: NextRequest) {
  return withAccessHandler(request, 'coach:athlete:list', null, async ({ user, actor }) => {
    const playerIds = [actor.athletePlayerId, ...actor.guardianOfPlayerIds].filter(
      (id): id is string => Boolean(id),
    );
    const items = await prisma.coachAthleteLink.findMany({
      where: {
        OR: [
          { coachUserId: user.id },
          ...(playerIds.length ? [{ playerId: { in: playerIds } }] : []),
        ],
      },
      include: { player: { select: { id: true, name: true } } },
      orderBy: { requestedAt: 'desc' },
    });
    return NextResponse.json({ items });
  });
}

export async function POST(request: NextRequest) {
  return withAccessHandler(request, 'coach:athlete:follow', null, async ({ user, actor }) => {
    if (!getProfiles(actor).includes('TREINADOR')) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }
    const body = RequestSchema.safeParse(await request.json());
    if (!body.success) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', details: body.error.flatten() }, { status: 400 });
    }
    const player = await prisma.player.findUnique({
      where: { id: body.data.playerId },
      select: { id: true, userId: true },
    });
    if (!player || player.userId === user.id) {
      return NextResponse.json({ error: 'ATHLETE_NOT_AVAILABLE' }, { status: 404 });
    }
    const prior = await prisma.coachAthleteLink.findUnique({
      where: { coachUserId_playerId: { coachUserId: user.id, playerId: player.id } },
    });
    if (prior && ['PENDING', 'ACTIVE'].includes(prior.status)) {
      return NextResponse.json({ error: 'LINK_ALREADY_EXISTS' }, { status: 409 });
    }
    const item = await prisma.coachAthleteLink.upsert({
      where: { coachUserId_playerId: { coachUserId: user.id, playerId: player.id } },
      update: { status: 'PENDING', requestedAt: new Date(), respondedAt: null, endedAt: null },
      create: { coachUserId: user.id, playerId: player.id },
    });
    await prisma.auditLog.create({
      data: { actorUserId: user.id, action: 'COACH_ATHLETE_LINK_REQUESTED', resourceType: 'Player', resourceId: player.id },
    });
    return NextResponse.json({ id: item.id, status: item.status }, { status: 201 });
  });
}

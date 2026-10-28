import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { withAccessHandler } from '@/lib/access-handler';
import { invalidateActor } from '@/services/accessService';

const DecisionSchema = z.object({ status: z.enum(['ACTIVE', 'REJECTED']) });

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return withAccessHandler(
    request,
    'coach:athlete:respond',
    async () => (await prisma.coachAthleteLink.findUnique({
      where: { id },
      select: { playerId: true },
    })) ?? undefined,
    async ({ user }) => {
      const body = DecisionSchema.safeParse(await request.json());
      if (!body.success) {
        return NextResponse.json({ error: 'VALIDATION_ERROR', details: body.error.flatten() }, { status: 400 });
      }
      const link = await prisma.coachAthleteLink.findUnique({
        where: { id },
        select: { coachUserId: true, playerId: true, status: true },
      });
      if (!link || link.status !== 'PENDING') return NextResponse.json({ error: 'REQUEST_NOT_FOUND' }, { status: 404 });
      const result = await prisma.coachAthleteLink.updateMany({
        where: { id, status: 'PENDING' },
        data: { status: body.data.status, respondedAt: new Date() },
      });
      if (!result.count) return NextResponse.json({ error: 'REQUEST_ALREADY_DECIDED' }, { status: 409 });
      await prisma.auditLog.create({
        data: { actorUserId: user.id, action: `COACH_ATHLETE_LINK_${body.data.status}`, resourceType: 'Player', resourceId: link.playerId },
      });
      invalidateActor(link.coachUserId);
      return NextResponse.json({ status: body.data.status });
    },
  );
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return withAccessHandler(request, 'coach:athlete:follow', null, async ({ user }) => {
    const result = await prisma.coachAthleteLink.updateMany({
      where: { id, coachUserId: user.id, status: 'ACTIVE' },
      data: { status: 'ENDED', endedAt: new Date() },
    });
    if (!result.count) return NextResponse.json({ error: 'LINK_NOT_FOUND' }, { status: 404 });
    const link = await prisma.coachAthleteLink.findUnique({ where: { id }, select: { playerId: true } });
    await prisma.auditLog.create({
      data: { actorUserId: user.id, action: 'COACH_ATHLETE_LINK_ENDED', resourceType: 'Player', resourceId: link?.playerId },
    });
    invalidateActor(user.id);
    return NextResponse.json({ ended: true });
  });
}

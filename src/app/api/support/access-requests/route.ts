import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { withAccessHandler } from '@/lib/access-handler';
import { isPlatformOperator, isProtectedTarget, isSupport } from './support-access.logic';

const RequestSchema = z.object({
  targetUserId: z.string().min(1),
  reason: z.string().trim().min(20).max(500),
});

export async function GET(request: NextRequest) {
  return withAccessHandler(request, 'support:account:assist', null, async ({ user, actor }) => {
    const where = isSupport(actor) ? { requesterUserId: user.id } : {};
    const items = await prisma.supportAccessRequest.findMany({
      where,
      select: {
        id: true, requesterUserId: true, targetUserId: true, reason: true,
        status: true, createdAt: true, decidedAt: true, expiresAt: true, accessedAt: true,
        ...(isPlatformOperator(actor) ? { target: { select: { name: true, email: true, role: true } } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return NextResponse.json({ items });
  });
}

export async function POST(request: NextRequest) {
  return withAccessHandler(request, 'support:account:assist', null, async ({ user, actor }) => {
    if (!isSupport(actor)) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    const body = RequestSchema.safeParse(await request.json());
    if (!body.success) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', details: body.error.flatten() }, { status: 400 });
    }
    if (body.data.targetUserId === user.id || await isProtectedTarget(body.data.targetUserId)) {
      return NextResponse.json({ error: 'TARGET_NOT_ELIGIBLE' }, { status: 404 });
    }
    const pending = await prisma.supportAccessRequest.findFirst({
      where: { requesterUserId: user.id, targetUserId: body.data.targetUserId, status: 'PENDING' },
      select: { id: true },
    });
    if (pending) return NextResponse.json({ error: 'REQUEST_ALREADY_PENDING' }, { status: 409 });
    const item = await prisma.supportAccessRequest.create({
      data: { requesterUserId: user.id, targetUserId: body.data.targetUserId, reason: body.data.reason },
      select: { id: true, status: true, createdAt: true },
    });
    await prisma.auditLog.create({
      data: { actorUserId: user.id, action: 'SUPPORT_ACCESS_REQUESTED', resourceType: 'User', resourceId: item.id },
    });
    return NextResponse.json(item, { status: 201 });
  });
}

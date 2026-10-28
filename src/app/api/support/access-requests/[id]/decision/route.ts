import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { withAccessHandler } from '@/lib/access-handler';
import { isProtectedTarget } from '../../support-access.logic';

const DecisionSchema = z.object({ status: z.enum(['APPROVED', 'REJECTED']) });
const ACCESS_WINDOW_MS = 30 * 60 * 1000;

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return withAccessHandler(request, 'support:access:approve', null, async ({ user }) => {
    const body = DecisionSchema.safeParse(await request.json());
    if (!body.success) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', details: body.error.flatten() }, { status: 400 });
    }
    const item = await prisma.supportAccessRequest.findUnique({
      where: { id },
      select: { targetUserId: true, status: true },
    });
    if (!item || item.status !== 'PENDING') return NextResponse.json({ error: 'REQUEST_NOT_FOUND' }, { status: 404 });
    if (body.data.status === 'APPROVED' && await isProtectedTarget(item.targetUserId)) {
      return NextResponse.json({ error: 'TARGET_NOT_ELIGIBLE' }, { status: 409 });
    }
    const now = new Date();
    const result = await prisma.supportAccessRequest.updateMany({
      where: { id, status: 'PENDING' },
      data: {
        status: body.data.status,
        decidedAt: now,
        approvedByUserId: body.data.status === 'APPROVED' ? user.id : null,
        expiresAt: body.data.status === 'APPROVED' ? new Date(now.getTime() + ACCESS_WINDOW_MS) : null,
      },
    });
    if (!result.count) return NextResponse.json({ error: 'REQUEST_ALREADY_DECIDED' }, { status: 409 });
    await prisma.auditLog.create({
      data: { actorUserId: user.id, action: `SUPPORT_ACCESS_${body.data.status}`, resourceType: 'User', resourceId: id },
    });
    return NextResponse.json({ status: body.data.status });
  });
}

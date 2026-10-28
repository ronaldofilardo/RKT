import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAccessHandler } from '@/lib/access-handler';
import { isSupport } from '../../support-access.logic';

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return withAccessHandler(request, 'support:account:assist', null, async ({ user, actor }) => {
    if (!isSupport(actor)) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    const now = new Date();
    const claim = await prisma.supportAccessRequest.updateMany({
      where: {
        id, requesterUserId: user.id, status: 'APPROVED',
        accessedAt: null, expiresAt: { gt: now },
      },
      data: { accessedAt: now },
    });
    if (!claim.count) return NextResponse.json({ error: 'ACCESS_NOT_AVAILABLE' }, { status: 403 });
    const access = await prisma.supportAccessRequest.findUnique({
      where: { id },
      select: { targetUserId: true },
    });
    const target = access && await prisma.user.findUnique({
      where: { id: access.targetUserId },
      select: { id: true, name: true, email: true, role: true, isActive: true, club: true, createdAt: true },
    });
    await prisma.auditLog.create({
      data: { actorUserId: user.id, action: 'SUPPORT_ACCESS_USED', resourceType: 'User', resourceId: access?.targetUserId },
    });
    if (!target) return NextResponse.json({ error: 'USER_NOT_FOUND' }, { status: 404 });
    return NextResponse.json({ user: target });
  });
}

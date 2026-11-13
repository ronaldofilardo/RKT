import { describe, it, expect, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GET as getScheduled } from '../scheduled/route';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    notification: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock('@/lib/access-handler', () => ({
  withAccessHandler: jest.fn(async (_req, _action, _res, handler) => {
    return handler({
      user: { id: 'athlete-user-1', role: 'ATHLETE' },
      actor: { userId: 'athlete-user-1', isActive: true, canOperate: true, memberships: [] },
    });
  }),
}));

const mockPrisma = prisma as any;

describe('GET /api/notifications/scheduled', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna notificações não lidas de POOL_MATCH_WITH_MY_ATHLETE', async () => {
    const mockList = [
      {
        id: 'notif-sched-1',
        type: 'POOL_MATCH_WITH_MY_ATHLETE',
        recipientId: 'athlete-user-1',
        payload: {
          matchId: 'match-1',
          templateId: 'tpl-1',
          player1Name: 'Carlos Silva',
          player2Name: 'João Santos',
          createdByName: 'Treinador Bernardo',
          scheduledAt: '2026-11-15T14:00:00Z',
        },
        readAt: null,
      },
    ];
    mockPrisma.notification.findMany.mockResolvedValue(mockList);

    const req = new NextRequest('http://localhost:3000/api/notifications/scheduled');
    const res = await getScheduled(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual(mockList);
    expect(mockPrisma.notification.findMany).toHaveBeenCalledWith({
      where: {
        recipientId: 'athlete-user-1',
        type: 'POOL_MATCH_WITH_MY_ATHLETE',
        readAt: null,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  });
});


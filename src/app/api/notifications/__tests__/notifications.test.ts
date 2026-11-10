import { describe, it, expect, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GET as getCount } from '../count/route';
import { GET as getAssigned } from '../assigned/route';
import { PATCH as markRead } from '../[id]/read/route';
import { PATCH as markReadAll } from '../read-all/route';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    notification: {
      groupBy: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}));

jest.mock('@/lib/access-handler', () => ({
  withAccessHandler: jest.fn(async (_req, _action, _res, handler) => {
    return handler({
      user: { id: 'user-notif-1', role: 'ANNOTATOR' },
      actor: { userId: 'user-notif-1', isActive: true, canOperate: true, memberships: [] },
    });
  }),
}));

const mockPrisma = prisma as any;

describe('Notifications API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/notifications/count', () => {
    it('retorna zeros quando não há notificações não lidas', async () => {
      mockPrisma.notification.groupBy.mockResolvedValue([]);

      const req = new NextRequest('http://localhost:3000/api/notifications/count');
      const res = await getCount(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json).toEqual({
        pool_with_athlete: 0,
        pool_available: 0,
        assigned: 0,
      });
    });

    it('retorna contagens agregadas por tipo', async () => {
      mockPrisma.notification.groupBy.mockResolvedValue([
        { type: 'POOL_MATCH_WITH_MY_ATHLETE', _count: { id: 3 } },
        { type: 'POOL_MATCH_AVAILABLE', _count: { id: 5 } },
        { type: 'ASSIGNED_TO_ANNOTATE', _count: { id: 2 } },
      ]);

      const req = new NextRequest('http://localhost:3000/api/notifications/count');
      const res = await getCount(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json).toEqual({
        pool_with_athlete: 3,
        pool_available: 5,
        assigned: 2,
      });
    });
  });

  describe('GET /api/notifications/assigned', () => {
    it('retorna notificações do tipo ASSIGNED_TO_ANNOTATE não lidas', async () => {
      const mockList = [
        { id: 'notif-1', type: 'ASSIGNED_TO_ANNOTATE', payload: { player1Name: 'P1' } },
      ];
      mockPrisma.notification.findMany.mockResolvedValue(mockList);

      const req = new NextRequest('http://localhost:3000/api/notifications/assigned');
      const res = await getAssigned(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json).toEqual(mockList);
    });
  });

  describe('PATCH /api/notifications/[id]/read', () => {
    it('marca notificação como lida com sucesso', async () => {
      mockPrisma.notification.findUnique.mockResolvedValue({
        id: 'notif-1',
        recipientId: 'user-notif-1',
      });
      mockPrisma.notification.update.mockResolvedValue({
        id: 'notif-1',
        readAt: new Date('2026-11-10T10:00:00Z'),
      });

      const req = new NextRequest('http://localhost:3000/api/notifications/notif-1/read', {
        method: 'PATCH',
      });
      const res = await markRead(req, { params: Promise.resolve({ id: 'notif-1' }) });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.id).toBe('notif-1');
      expect(json.readAt).toBeDefined();
    });

    it('retorna 404 se a notificação não existir', async () => {
      mockPrisma.notification.findUnique.mockResolvedValue(null);

      const req = new NextRequest('http://localhost:3000/api/notifications/notif-x/read', {
        method: 'PATCH',
      });
      const res = await markRead(req, { params: Promise.resolve({ id: 'notif-x' }) });

      expect(res.status).toBe(404);
    });

    it('retorna 403 se a notificação pertencer a outro usuário', async () => {
      mockPrisma.notification.findUnique.mockResolvedValue({
        id: 'notif-other',
        recipientId: 'other-user',
      });

      const req = new NextRequest('http://localhost:3000/api/notifications/notif-other/read', {
        method: 'PATCH',
      });
      const res = await markRead(req, { params: Promise.resolve({ id: 'notif-other' }) });

      expect(res.status).toBe(403);
    });
  });

  describe('PATCH /api/notifications/read-all', () => {
    it('marca todas as notificações de um tipo como lidas', async () => {
      mockPrisma.notification.updateMany.mockResolvedValue({ count: 4 });

      const req = new NextRequest('http://localhost:3000/api/notifications/read-all', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ type: 'POOL_MATCH_AVAILABLE' }),
      });
      const res = await markReadAll(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.count).toBe(4);
    });
  });
});


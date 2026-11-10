import { describe, it, expect, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GET } from '../route';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    membership: { findMany: jest.fn() },
    playerCT: { findMany: jest.fn() },
    match: { findMany: jest.fn() },
  },
}));

jest.mock('../../_logic', () => ({
  getGestorCtId: jest.fn().mockResolvedValue('ct-1'),
  denyGestor: jest.fn(),
}));

jest.mock('@/lib/access-handler', () => ({
  withAccessHandler: jest.fn(async (_req, _action, _res, handler) => {
    return handler({
      user: { id: 'gestor-1', name: 'Gestor', role: 'GESTOR' },
      actor: { userId: 'gestor-1', isActive: true, canOperate: true, memberships: [] },
    });
  }),
}));

const mockPrisma = prisma as any;

describe('GET /api/gestor/matches', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lista partidas do clube criadas sem indicação de anotador', async () => {
    mockPrisma.membership.findMany.mockResolvedValue([
      { userId: 'gestor-1' },
      { userId: 'coach-1' },
    ]);
    mockPrisma.playerCT.findMany.mockResolvedValue([
      { playerId: 'p1', player: { userId: 'u-p1' } },
      { playerId: 'p2', player: { userId: 'u-p2' } },
    ]);

    const mockMatches = [
      {
        id: 'match-sem-anotador',
        format: 'BEST_OF_3',
        state: 'SCHEDULED',
        createdAt: new Date('2026-11-10T10:00:00Z'),
        startedAt: null,
        finishedAt: null,
        scoreState: null,
        createdByUserId: 'gestor-1',
        assignedCoachId: null,
        assignedCoach: null,
        isPublicTemplate: false,
        sourceMatchId: null,
        player1: { id: 'p1', name: 'Carlos', club: 'CT' },
        player2: { id: 'p2', name: 'Rafael', club: 'CT' },
        createdByUser: { id: 'gestor-1', name: 'Gestor', email: 'g@x.com' },
        sourceMatch: null,
      },
    ];

    mockPrisma.match.findMany.mockResolvedValue(mockMatches);

    const req = new NextRequest('http://localhost:3000/api/gestor/matches');
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.items).toHaveLength(1);
    expect(json.items[0].id).toBe('match-sem-anotador');
    expect(json.items[0].assignedCoachId).toBeNull();
    expect(json.items[0].assignedCoach).toBeNull();
  });
});


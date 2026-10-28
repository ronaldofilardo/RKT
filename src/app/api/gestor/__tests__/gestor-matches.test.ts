import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';

const mockPrisma = {
  membership: {
    findMany: jest.fn(),
  },
  playerCT: {
    findMany: jest.fn(),
  },
  match: {
    findMany: jest.fn(),
  },
};

jest.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
jest.mock('../_logic', () => ({
  getGestorCtId: jest.fn().mockResolvedValue('ct-123'),
  denyGestor: jest.fn().mockReturnValue(new Response(JSON.stringify({ error: 'DENIED' }), { status: 403 })),
}));
jest.mock('@/lib/access-handler', () => ({
  withAccessHandler: jest.fn((req, perm, ctx, handler: any) =>
    handler({ user: { id: 'u-gestor', role: 'ANNOTATOR' } }),
  ),
}));

describe('GET /api/gestor/matches', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna partidas vinculadas ao CT e anotadas por membros do clube', async () => {
    mockPrisma.membership.findMany.mockResolvedValue([
      { userId: 'u-coach-1' },
    ] as any);
    mockPrisma.playerCT.findMany.mockResolvedValue([
      { playerId: 'player-1', player: { userId: 'u-athlete-1' } },
    ] as any);

    mockPrisma.match.findMany.mockResolvedValue([
      {
        id: 'm-1',
        format: 'BEST_OF_3',
        state: 'FINISHED',
        createdAt: new Date('2026-10-27T10:00:00Z'),
        startedAt: new Date('2026-10-27T10:05:00Z'),
        finishedAt: new Date('2026-10-27T11:00:00Z'),
        player1: { id: 'player-1', name: 'Atleta CT' },
        player2: { id: 'player-2', name: 'Atleta Visitante' },
        createdByUser: { id: 'u-coach-1', name: 'Coach 1', email: 'coach@club.com' },
        scoreState: { sets: [] },
      },
    ] as any);

    const { GET } = await import('../matches/route');
    const req = new NextRequest('http://localhost:3000/api/gestor/matches');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.total).toBe(1);
    expect(json.items[0].id).toBe('m-1');
    expect(json.items[0].player1.name).toBe('Atleta CT');
    expect(json.items[0].createdByUser.name).toBe('Coach 1');

    expect(mockPrisma.match.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          deletedAt: null,
          OR: expect.arrayContaining([
            { ctId: 'ct-123' },
            { createdByUserId: { in: expect.arrayContaining(['u-coach-1', 'u-athlete-1']) } },
            { player1Id: { in: ['player-1'] } },
            { player2Id: { in: ['player-1'] } },
          ]),
        }),
      }),
    );
  });
});

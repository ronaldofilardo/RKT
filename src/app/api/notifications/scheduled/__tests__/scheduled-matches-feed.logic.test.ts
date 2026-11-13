import { loadScheduledMatchesFeed } from '../scheduled-matches-feed.logic';
import { prisma } from '@/lib/prisma';
import type { Actor } from '@/core/access';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    notification: {
      findMany: jest.fn(),
    },
    match: {
      findMany: jest.fn(),
    },
  },
}));

describe('loadScheduledMatchesFeed', () => {
  const mockPrisma = prisma as unknown as {
    notification: { findMany: jest.Mock };
    match: { findMany: jest.Mock };
  };

  const baseActor: Actor = {
    userId: 'user-athlete-1',
    isActive: true,
    canOperate: true,
    memberships: [],
    athletePlayerId: 'player-1',
    athleteCtIds: [],
    guardianOfPlayerIds: [],
    followedPlayerIds: [],
    activeArea: 'ATLETA',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna vazio se o usuário ativo for Gestor', async () => {
    const gestorActor: Actor = {
      ...baseActor,
      activeArea: 'GESTOR',
    };
    const result = await loadScheduledMatchesFeed(gestorActor);
    expect(result).toEqual([]);
    expect(mockPrisma.notification.findMany).not.toHaveBeenCalled();
  });

  it('retorna notificações dinâmicas para atleta mesmo sem registro prévio na tabela Notification', async () => {
    mockPrisma.notification.findMany
      .mockResolvedValueOnce([]) // existing unread
      .mockResolvedValueOnce([]); // dismissed

    mockPrisma.match.findMany.mockResolvedValueOnce([
      {
        id: 'match-100',
        scheduledAt: new Date('2026-11-20T10:00:00Z'),
        format: 'BEST_OF_3_MATCH_TB',
        tournamentName: 'Open RKT',
        createdAt: new Date('2026-11-12T12:00:00Z'),
        createdByUserId: 'user-coach-2',
        isTemplate: true,
        sourceMatchId: null,
        player1: { id: 'player-1', name: 'Atleta Meu' },
        player2: { id: 'player-2', name: 'Atleta Adversário' },
        createdByUser: {
          name: 'Treinador Carlos',
          role: 'COACH',
          memberships: [{ kind: 'TREINADOR', ct: null }],
          athleteProfile: null,
        },
      },
    ]);

    const feed = await loadScheduledMatchesFeed(baseActor);

    expect(feed).toHaveLength(1);
    expect(feed[0].id).toBe('match-scheduled-match-100');
    expect(feed[0].payload.player1Name).toBe('Atleta Meu');
    expect(feed[0].payload.player2Name).toBe('Atleta Adversário');
    expect(feed[0].payload.createdByName).toBe('Treinador Carlos');
    expect(feed[0].payload.creatorRole).toBe('Treinador Pessoal');
  });

  it('ignora partidas já dispensadas pelo usuário', async () => {
    mockPrisma.notification.findMany
      .mockResolvedValueOnce([]) // unread
      .mockResolvedValueOnce([{ payload: { matchId: 'match-dismissed-1' } }]); // dismissed

    mockPrisma.match.findMany.mockResolvedValueOnce([]);

    const feed = await loadScheduledMatchesFeed(baseActor);
    expect(feed).toHaveLength(0);

    expect(mockPrisma.match.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: { notIn: ['match-dismissed-1'] },
        }),
      }),
    );
  });
});


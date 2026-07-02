jest.mock('@/lib/prisma', () => {
  const tx: any = {
    matchAnnotationSession: {
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  };
  return {
    prisma: {
      $transaction: jest.fn((fn: any) => fn(tx)),
      matchAnnotationSession: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        findFirst: jest.fn(),
      },
      annotationEndorsement: {
        create: jest.fn(),
      },
      match: {
        findUnique: jest.fn(),
      },
    },
  };
});

import { prisma } from '@/lib/prisma';

const mockPrisma = prisma as any;
const mockTx = {
  matchAnnotationSession: {
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
};

describe('sessionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.$transaction.mockImplementation((fn: any) => fn(mockTx));
  });

  describe('listSuspendedSessions', () => {
    it('deve buscar sessões ABANDONED e IN_PROGRESS de partidas IN_PROGRESS', async () => {
      const { listSuspendedSessions } = await import('@/services/sessionService');

      mockPrisma.matchAnnotationSession.findMany.mockResolvedValue([
        {
          id: 's1',
          annotatorUserId: 'user-1',
          status: 'ABANDONED',
          isActive: false,
          match: { id: 'm1', state: 'IN_PROGRESS', player1: { id: 'p1', name: 'P1' }, player2: { id: 'p2', name: 'P2' } },
        },
        {
          id: 's2',
          annotatorUserId: 'user-1',
          status: 'IN_PROGRESS',
          isActive: true,
          match: { id: 'm2', state: 'IN_PROGRESS', player1: { id: 'p3', name: 'P3' }, player2: { id: 'p4', name: 'P4' } },
        },
      ]);

      const result = await listSuspendedSessions('user-1');

      expect(mockPrisma.matchAnnotationSession.findMany).toHaveBeenCalledWith({
        where: {
          annotatorUserId: 'user-1',
          status: { in: ['ABANDONED', 'IN_PROGRESS'] },
          match: { state: 'IN_PROGRESS' },
        },
        include: {
          match: {
            include: {
              player1: { select: { id: true, name: true } },
              player2: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('updateSession', () => {
    it('deve atualizar sessão com dados fornecidos', async () => {
      const { updateSession } = await import('@/services/sessionService');

      mockPrisma.matchAnnotationSession.update.mockResolvedValue({
        id: 's1',
        status: 'ABANDONED',
        isActive: false,
        annotator: { id: 'user-1', name: 'Coach', email: 'c@test.com' },
      });

      await updateSession('s1', {
        status: 'ABANDONED',
        isActive: false,
        matchStateSnapshot: '{}',
      });

      expect(mockPrisma.matchAnnotationSession.update).toHaveBeenCalledWith({
        where: { id: 's1' },
        data: {
          status: 'ABANDONED',
          isActive: false,
          matchStateSnapshot: '{}',
        },
        include: { annotator: { select: { id: true, name: true, email: true } } },
      });
    });
  });

  describe('reactivateOrCreateSession', () => {
    it('deve criar nova sessão quando não há existentes', async () => {
      const { reactivateOrCreateSession } = await import('@/services/sessionService');

      mockTx.matchAnnotationSession.create.mockResolvedValue({
        id: 'new-session',
        matchId: 'm1',
        annotatorUserId: 'user-1',
        isActive: true,
        status: 'IN_PROGRESS',
        annotator: { id: 'user-1', name: 'Coach', email: 'c@test.com' },
      });

      const result = await reactivateOrCreateSession('m1', 'user-1', []);

      expect(mockTx.matchAnnotationSession.create).toHaveBeenCalledWith({
        data: { matchId: 'm1', annotatorUserId: 'user-1', isActive: true, status: 'IN_PROGRESS' },
        include: { annotator: { select: { id: true, name: true, email: true } } },
      });
      expect(result.id).toBe('new-session');
    });

    it('deve reativar a sessão mais recente', async () => {
      const { reactivateOrCreateSession } = await import('@/services/sessionService');

      const existingSessions = [
        { id: 'recent-session', isActive: false, status: 'ABANDONED' },
      ];

      mockTx.matchAnnotationSession.update.mockResolvedValue({
        id: 'recent-session',
        isActive: true,
        status: 'IN_PROGRESS',
        annotator: { id: 'user-1', name: 'Coach', email: 'c@test.com' },
      });

      const result = await reactivateOrCreateSession('m1', 'user-1', existingSessions as any);

      expect(mockTx.matchAnnotationSession.update).toHaveBeenCalledWith({
        where: { id: 'recent-session' },
        data: { isActive: true, status: 'IN_PROGRESS' },
        include: { annotator: { select: { id: true, name: true, email: true } } },
      });
    });

    it('deve abandonar sessões mais antigas quando há múltiplas', async () => {
      const { reactivateOrCreateSession } = await import('@/services/sessionService');

      const existingSessions = [
        { id: 'recent-session', isActive: false, status: 'ABANDONED' },
        { id: 'old-session-1', isActive: false, status: 'ABANDONED' },
        { id: 'old-session-2', isActive: false, status: 'ABANDONED' },
      ];

      mockTx.matchAnnotationSession.update.mockResolvedValue({
        id: 'recent-session',
        isActive: true,
        status: 'IN_PROGRESS',
        annotator: { id: 'user-1', name: 'Coach', email: 'c@test.com' },
      });

      await reactivateOrCreateSession('m1', 'user-1', existingSessions as any);

      expect(mockTx.matchAnnotationSession.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['old-session-1', 'old-session-2'] } },
        data: { status: 'ABANDONED', isActive: false },
      });
      expect(mockTx.matchAnnotationSession.update).toHaveBeenCalledWith({
        where: { id: 'recent-session' },
        data: { isActive: true, status: 'IN_PROGRESS' },
        include: { annotator: { select: { id: true, name: true, email: true } } },
      });
    });
  });

  describe('getSessionWithMatch', () => {
    it('deve buscar sessão com matchId', async () => {
      const { getSessionWithMatch } = await import('@/services/sessionService');

      mockPrisma.matchAnnotationSession.findUnique.mockResolvedValue({
        id: 's1',
        matchId: 'm1',
        annotatorUserId: 'user-1',
        isActive: true,
        status: 'IN_PROGRESS',
      });

      const result = await getSessionWithMatch('s1', 'm1');

      expect(mockPrisma.matchAnnotationSession.findUnique).toHaveBeenCalledWith({
        where: { id: 's1' },
        select: { id: true, matchId: true, annotatorUserId: true, isActive: true, status: true },
      });
      expect(result).toBeTruthy();
    });
  });

  describe('checkMatchExists', () => {
    it('deve verificar se partida existe', async () => {
      const { checkMatchExists } = await import('@/services/sessionService');

      mockPrisma.match.findUnique.mockResolvedValue({ state: 'IN_PROGRESS', openForAnnotation: true });

      const result = await checkMatchExists('m1');

      expect(mockPrisma.match.findUnique).toHaveBeenCalledWith({
        where: { id: 'm1' },
        select: { state: true, openForAnnotation: true, version: true, scoreState: true },
      });
    });
  });

  describe('createEndorsement', () => {
    it('deve criar endorsement', async () => {
      const { createEndorsement } = await import('@/services/sessionService');

      mockPrisma.annotationEndorsement.create.mockResolvedValue({
        id: 'e1',
        sessionId: 's1',
        endorsedByUserId: 'user-1',
        endorsedBy: { id: 'user-1', name: 'Coach', email: 'c@test.com' },
      });

      const result = await createEndorsement('s1', 'user-1');

      expect(mockPrisma.annotationEndorsement.create).toHaveBeenCalledWith({
        data: { sessionId: 's1', endorsedByUserId: 'user-1' },
        include: { endorsedBy: { select: { id: true, name: true, email: true } } },
      });
    });
  });
});

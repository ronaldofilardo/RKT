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
      matchAnnotationSession: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      annotationEndorsement: {
        create: jest.fn(),
      },
      match: {
        findUnique: jest.fn(),
      },
      $transaction: jest.fn((fn: any) => fn(tx)),
    },
    _tx: tx,
  };
});

import { PrismaSessionRepository } from '../PrismaSessionRepository';
import { prisma } from '@/lib/prisma';

const mockPrisma = prisma as any;
const mockTx = (require('@/lib/prisma') as any)._tx;

describe('PrismaSessionRepository', () => {
  let repository: PrismaSessionRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new PrismaSessionRepository();
  });

  describe('list', () => {
    it('deve listar sessões para um match', async () => {
      const mockSessions = [{ id: 's1', annotatorUserId: 'u1' }];
      mockPrisma.matchAnnotationSession.findMany.mockResolvedValue(mockSessions);

      const result = await repository.list('match-1');

      expect(mockPrisma.matchAnnotationSession.findMany).toHaveBeenCalledWith({
        where: { matchId: 'match-1' },
        select: expect.objectContaining({
          id: true,
          annotatorUserId: true,
          isActive: true,
        }),
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(mockSessions);
    });

    it('deve retornar array vazio quando não há sessões', async () => {
      mockPrisma.matchAnnotationSession.findMany.mockResolvedValue([]);

      const result = await repository.list('match-empty');

      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    it('deve retornar sessão por id', async () => {
      const mockSession = { id: 's1', matchId: 'm1', annotatorUserId: 'u1', isActive: true, status: 'IN_PROGRESS' };
      mockPrisma.matchAnnotationSession.findUnique.mockResolvedValue(mockSession);

      const result = await repository.findById('s1');

      expect(mockPrisma.matchAnnotationSession.findUnique).toHaveBeenCalledWith({
        where: { id: 's1' },
        select: expect.objectContaining({ id: true, matchId: true }),
      });
      expect(result).toEqual(mockSession);
    });

    it('deve retornar null quando sessão não existe', async () => {
      mockPrisma.matchAnnotationSession.findUnique.mockResolvedValue(null);

      const result = await repository.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('listForUser', () => {
    it('deve listar sessões de um usuário para um match', async () => {
      const mockSessions = [{ id: 's1', annotatorUserId: 'u1' }];
      mockPrisma.matchAnnotationSession.findMany.mockResolvedValue(mockSessions);

      const result = await repository.listForUser('match-1', 'u1');

      expect(mockPrisma.matchAnnotationSession.findMany).toHaveBeenCalledWith({
        where: { matchId: 'match-1', annotatorUserId: 'u1' },
        include: expect.objectContaining({ annotator: expect.anything() }),
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(mockSessions);
    });
  });

  describe('listSuspendedForUser', () => {
    it('deve buscar sessões ABANDONED com matchStateSnapshot', async () => {
      mockPrisma.matchAnnotationSession.findMany.mockResolvedValue([
        {
          id: 's1',
          matchId: 'm1',
          status: 'ABANDONED',
          matchStateSnapshot: '{"sets":[]}',
          match: { state: 'IN_PROGRESS' },
        },
        {
          id: 's2',
          matchId: 'm2',
          status: 'ABANDONED',
          matchStateSnapshot: '{"sets":[]}',
          match: { state: 'FINISHED' },
        },
        {
          id: 's3',
          matchId: 'm3',
          status: 'ABANDONED',
          matchStateSnapshot: '{"sets":[]}',
          match: { state: 'SCHEDULED' },
        },
      ]);

      const result = await repository.listSuspendedForUser('u1');

      expect(mockPrisma.matchAnnotationSession.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            annotatorUserId: 'u1',
            status: 'ABANDONED',
            matchStateSnapshot: { not: null },
          },
          take: 50,
        })
      );
      expect(result).toHaveLength(2);
      expect(result.map((s: any) => s.id)).toEqual(['s1', 's2']);
    });

    it('deve filtrar sessões sem match', async () => {
      mockPrisma.matchAnnotationSession.findMany.mockResolvedValue([
        {
          id: 's1',
          status: 'ABANDONED',
          matchStateSnapshot: '{}',
          match: null,
        },
      ]);

      const result = await repository.listSuspendedForUser('u1');

      expect(result).toHaveLength(1);
    });
  });

  describe('update', () => {
    it('deve atualizar sessão', async () => {
      const mockUpdated = { id: 's1', isActive: false };
      mockPrisma.matchAnnotationSession.update.mockResolvedValue(mockUpdated);

      const result = await repository.update('s1', { isActive: false });

      expect(mockPrisma.matchAnnotationSession.update).toHaveBeenCalledWith({
        where: { id: 's1' },
        data: { isActive: false },
        include: expect.objectContaining({ annotator: expect.anything() }),
      });
      expect(result).toEqual(mockUpdated);
    });
  });

  describe('createEndorsement', () => {
    it('deve criar endorsement', async () => {
      const mockEndorsement = { id: 'e1', sessionId: 's1', endorsedByUserId: 'u1' };
      mockPrisma.annotationEndorsement.create.mockResolvedValue(mockEndorsement);

      const result = await repository.createEndorsement('s1', 'u1');

      expect(mockPrisma.annotationEndorsement.create).toHaveBeenCalledWith({
        data: { sessionId: 's1', endorsedByUserId: 'u1' },
        include: expect.objectContaining({ endorsedBy: expect.anything() }),
      });
      expect(result).toEqual(mockEndorsement);
    });
  });

  describe('reactivateOrCreate', () => {
    it('deve reativar sessão existente quando há apenas uma', async () => {
      const existingSessions = [{ id: 's1' }];
      const mockReactivated = { id: 's1', isActive: true, status: 'IN_PROGRESS' };

      mockTx.matchAnnotationSession.update.mockResolvedValue(mockReactivated);

      const result = await repository.reactivateOrCreate('m1', 'u1', existingSessions);

      expect(result).toEqual(mockReactivated);
    });

    it('deve criar nova sessão quando não há existentes', async () => {
      const mockCreated = { id: 's-new', matchId: 'm1', isActive: true, status: 'IN_PROGRESS' };

      mockTx.matchAnnotationSession.create.mockResolvedValue(mockCreated);

      const result = await repository.reactivateOrCreate('m1', 'u1', []);

      expect(result).toEqual(mockCreated);
    });

    it('deve abandonar sessões antigas quando há múltiplas', async () => {
      const existingSessions = [{ id: 's-old' }, { id: 's-older' }];
      const mockReactivated = { id: 's-old', isActive: true, status: 'IN_PROGRESS' };

      mockTx.matchAnnotationSession.update.mockResolvedValue(mockReactivated);
      mockTx.matchAnnotationSession.updateMany.mockResolvedValue({ count: 1 });

      await repository.reactivateOrCreate('m1', 'u1', existingSessions);

      expect(mockTx.matchAnnotationSession.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['s-older'] } },
        data: { status: 'ABANDONED', isActive: false },
      });
    });
  });

  describe('findMatchForSession', () => {
    it('deve retornar dados do match', async () => {
      const mockMatch = { state: 'IN_PROGRESS', openForAnnotation: true, version: 1, scoreState: {} };
      mockPrisma.match.findUnique.mockResolvedValue(mockMatch);

      const result = await repository.findMatchForSession('m1');

      expect(mockPrisma.match.findUnique).toHaveBeenCalledWith({
        where: { id: 'm1' },
        select: { state: true, openForAnnotation: true, version: true, scoreState: true },
      });
      expect(result).toEqual(mockMatch);
    });

    it('deve retornar null quando match não existe', async () => {
      mockPrisma.match.findUnique.mockResolvedValue(null);

      const result = await repository.findMatchForSession('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findMatchScoreState', () => {
    it('deve retornar scoreState do match', async () => {
      mockPrisma.match.findUnique.mockResolvedValue({ scoreState: { sets: [] } });

      const result = await repository.findMatchScoreState('m1');

      expect(mockPrisma.match.findUnique).toHaveBeenCalledWith({
        where: { id: 'm1' },
        select: { scoreState: true },
      });
      expect(result).toEqual({ scoreState: { sets: [] } });
    });

    it('deve retornar null quando match não existe', async () => {
      mockPrisma.match.findUnique.mockResolvedValue(null);

      const result = await repository.findMatchScoreState('nonexistent');

      expect(result).toBeNull();
    });
  });
});

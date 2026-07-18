jest.mock('@/lib/prisma', () => ({
  prisma: {
    match: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    pointLog: {
      deleteMany: jest.fn(),
    },
    matchAnnotationSession: {
      findFirst: jest.fn(),
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn((promises) => Promise.all(promises)),
  },
}));

import { prisma } from '@/lib/prisma';

const mockPrisma = prisma as any;

describe('matchService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listMatches', () => {
    it('deve listar partidas sem filtros', async () => {
      const { listMatches } = await import('@/services/matchService');

      mockPrisma.match.findMany.mockResolvedValue([
        { id: 'm1', state: 'SCHEDULED', player1: { id: 'p1', name: 'P1' }, player2: { id: 'p2', name: 'P2' } },
      ]);

      const result = await listMatches(null, null, 20);

      expect(mockPrisma.match.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 20,
          select: {
            id: true,
            state: true,
            format: true,
            sportType: true,
            courtType: true,
            scheduledAt: true,
            startedAt: true,
            finishedAt: true,
            nickname: true,
            visibility: true,
            isResuming: true,
            openForAnnotation: true,
            tournamentName: true,
            category: true,
            includeLet: true,
            round: true,
            bracketType: true,
            temperature: true,
            humidity: true,
            version: true,
            scoreState: true,
            initialServerId: true,
            player1: { select: { id: true, name: true } },
            player2: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        }),
      );
    });

    it('deve filtrar por estado e usar cursor', async () => {
      const { listMatches } = await import('@/services/matchService');

      mockPrisma.match.findMany.mockResolvedValue([]);

      await listMatches('IN_PROGRESS', 'cursor-abc', 10);

      expect(mockPrisma.match.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 1,
          cursor: { id: 'cursor-abc' },
          where: { state: 'IN_PROGRESS' },
        }),
      );
    });
  });

  describe('createMatch', () => {
    it('deve criar partida com state SCHEDULED por padrão', async () => {
      const { createMatch } = await import('@/services/matchService');

      mockPrisma.match.create.mockImplementation((args: any) => Promise.resolve({ id: 'new', ...args.data }));

      await createMatch({
        player1Id: 'p1',
        player2Id: 'p2',
        format: 'BEST_OF_3',
      } as any);

      expect(mockPrisma.match.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            state: 'SCHEDULED',
            category: null,
            includeLet: null,
            format: 'BEST_OF_3',
            sportType: 'TENNIS',
          }),
        }),
      );
    });
  });

  describe('updateMatch', () => {
    it('deve atualizar partida existente', async () => {
      const { updateMatch } = await import('@/services/matchService');

      mockPrisma.match.findFirst.mockResolvedValue({ id: 'm1' });
      mockPrisma.match.update.mockResolvedValue({ id: 'm1', nickname: 'New Name' });

      const result = await updateMatch('m1', { nickname: 'New Name' });

      expect(result).toBeTruthy();
      expect(mockPrisma.match.update).toHaveBeenCalled();
    });

    it('deve retornar null se partida não existe', async () => {
      const { updateMatch } = await import('@/services/matchService');

      mockPrisma.match.findFirst.mockResolvedValue(null);

      const result = await updateMatch('nonexistent', { nickname: 'X' });

      expect(result).toBeNull();
      expect(mockPrisma.match.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteMatch', () => {
    it('deve deletar partida existente e retornar sucesso', async () => {
      const { deleteMatch } = await import('@/services/matchService');

      mockPrisma.match.findFirst.mockResolvedValue({
        id: 'm1',
        pointLog: [],
        annotationSessions: [],
        state: 'SCHEDULED',
      });
      mockPrisma.match.delete.mockResolvedValue({ id: 'm1' });

      const result = await deleteMatch('m1', { type: 'hard' });

      expect(result).toEqual({ success: true, type: 'hard' });
    });

    it('deve retornar erro MATCH_NOT_FOUND se partida não existe', async () => {
      const { deleteMatch } = await import('@/services/matchService');

      mockPrisma.match.findFirst.mockResolvedValue(null);

      const result = await deleteMatch('nonexistent', { type: 'hard' });

      expect(result).toEqual({ error: 'MATCH_NOT_FOUND' });
    });
  });

  describe('transitionMatchState', () => {
    it('deve retornar null se partida não existe', async () => {
      const { transitionMatchState } = await import('@/services/matchService');

      mockPrisma.match.findFirst.mockResolvedValue(null);

      const result = await transitionMatchState('nonexistent', 'IN_PROGRESS');

      expect(result).toBeNull();
    });

    it('deve negar FINISHED sem scoreState', async () => {
      const { transitionMatchState } = await import('@/services/matchService');

      mockPrisma.match.findFirst.mockResolvedValue({
        id: 'm1',
        scoreState: null,
        initialServerId: 'p1',
        player1Id: 'p1',
        player2Id: 'p2',
        format: 'BEST_OF_3',
      });

      const result = await transitionMatchState('m1', 'FINISHED');

      expect(result).toEqual({ error: 'CANNOT_FINISH: Partida sem pontuação registrada' });
    });

    it('deve negar FINISHED sem initialServerId', async () => {
      const { transitionMatchState } = await import('@/services/matchService');

      mockPrisma.match.findFirst.mockResolvedValue({
        id: 'm1',
        scoreState: { sets: [] },
        initialServerId: null,
        player1Id: 'p1',
        player2Id: 'p2',
        format: 'BEST_OF_3',
      });

      const result = await transitionMatchState('m1', 'FINISHED');

      expect(result).toEqual({ error: 'MATCH_NOT_STARTED: Partida sem primeiro sacador definido' });
    });

    it('deve transitar para IN_PROGRESS com scoreState', async () => {
      const { transitionMatchState } = await import('@/services/matchService');

      mockPrisma.match.findFirst.mockResolvedValue({
        id: 'm1',
        state: 'SCHEDULED',
        player1Id: 'p1',
        player2Id: 'p2',
        format: 'BEST_OF_3',
        initialServerId: 'p1',
      });

      mockPrisma.match.update.mockResolvedValue({ id: 'm1', state: 'IN_PROGRESS' });

      const scoreState = { sets: [], currentGame: { player1: 15, player2: 0 }, server: 'player1', isFinished: false, winner: null, setsWon: { player1: 0, player2: 0 }, startedAt: null };

      const result = await transitionMatchState('m1', 'IN_PROGRESS', undefined, scoreState);

      expect(mockPrisma.match.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            state: 'IN_PROGRESS',
            scoreState: scoreState,
          }),
        }),
      );
    });

    it('deve transitar para IN_PROGRESS', async () => {
      const { transitionMatchState } = await import('@/services/matchService');

      mockPrisma.match.findFirst.mockResolvedValue({
        id: 'm1',
        state: 'SCHEDULED',
        player1Id: 'p1',
        player2Id: 'p2',
        format: 'BEST_OF_3',
        initialServerId: null,
      });

      mockPrisma.match.update.mockResolvedValue({ id: 'm1', state: 'IN_PROGRESS' });

      const result = await transitionMatchState('m1', 'IN_PROGRESS', 'p1');

      expect(mockPrisma.match.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            state: 'IN_PROGRESS',
            initialServerId: 'p1',
          }),
        }),
      );
    });
  });

  describe('findAbandonedSessionSnapshot', () => {
    it('deve encontrar sessão abandonada com snapshot', async () => {
      const { findAbandonedSessionSnapshot } = await import('@/services/matchService');

      mockPrisma.matchAnnotationSession.findFirst.mockResolvedValue({
        id: 's1',
        matchId: 'm1',
        status: 'ABANDONED',
        matchStateSnapshot: '{}',
      });

      const result = await findAbandonedSessionSnapshot('m1');

      expect(mockPrisma.matchAnnotationSession.findFirst).toHaveBeenCalledWith({
        where: {
          matchId: 'm1',
          status: 'ABANDONED',
          matchStateSnapshot: { not: null },
        },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toBeTruthy();
    });
  });

  describe('getMatch', () => {
    it('deve buscar partida por id com jogadores', async () => {
      const { getMatch } = await import('@/services/matchService');

      mockPrisma.match.findFirst.mockResolvedValue({
        id: 'm1',
        player1: { id: 'p1', name: 'Player 1' },
        player2: { id: 'p2', name: 'Player 2' },
      });

      const result = await getMatch('m1');

      expect(mockPrisma.match.findFirst).toHaveBeenCalledWith({
        where: { id: 'm1' },
        select: {
          id: true,
          state: true,
          format: true,
          sportType: true,
          courtType: true,
          scheduledAt: true,
          startedAt: true,
          finishedAt: true,
          nickname: true,
          visibility: true,
          isResuming: true,
          openForAnnotation: true,
          tournamentName: true,
          category: true,
          includeLet: true,
          round: true,
          bracketType: true,
          temperature: true,
          humidity: true,
          version: true,
          scoreState: true,
          initialServerId: true,
          player1: { select: { id: true, name: true } },
          player2: { select: { id: true, name: true } },
        },
      });
      expect(result?.player1.name).toBe('Player 1');
    });

    it('deve retornar null se partida não existe', async () => {
      const { getMatch } = await import('@/services/matchService');

      mockPrisma.match.findFirst.mockResolvedValue(null);

      const result = await getMatch('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('createMatch with optional params', () => {
    it('deve criar partida com sportType TENNIS (default)', async () => {
      const { createMatch } = await import('@/services/matchService');

      mockPrisma.match.create.mockImplementation((args: any) => Promise.resolve({ id: 'new', ...args.data }));

      await createMatch({
        player1Id: 'p1',
        player2Id: 'p2',
        format: 'BEST_OF_3',
      } as any);

      const call = mockPrisma.match.create.mock.calls[0][0];
      expect(call.data.sportType).toBe('TENNIS');
    });

    it('deve criar partida com sportType customizado', async () => {
      const { createMatch } = await import('@/services/matchService');

      mockPrisma.match.create.mockImplementation((args: any) => Promise.resolve({ id: 'new', ...args.data }));

      await createMatch({
        player1Id: 'p1',
        player2Id: 'p2',
        format: 'BEST_OF_3',
        sportType: 'PICKLEBALL',
      } as any);

      const call = mockPrisma.match.create.mock.calls[0][0];
      expect(call.data.sportType).toBe('PICKLEBALL');
    });

    it('deve criar partida com courtType customizado', async () => {
      const { createMatch } = await import('@/services/matchService');

      mockPrisma.match.create.mockImplementation((args: any) => Promise.resolve({ id: 'new', ...args.data }));

      await createMatch({
        player1Id: 'p1',
        player2Id: 'p2',
        format: 'BEST_OF_3',
        courtType: 'CLAY',
      } as any);

      const call = mockPrisma.match.create.mock.calls[0][0];
      expect(call.data.courtType).toBe('CLAY');
    });

    it('deve criar partida com visibility customizada', async () => {
      const { createMatch } = await import('@/services/matchService');

      mockPrisma.match.create.mockImplementation((args: any) => Promise.resolve({ id: 'new', ...args.data }));

      await createMatch({
        player1Id: 'p1',
        player2Id: 'p2',
        format: 'BEST_OF_3',
        visibility: 'PRIVATE',
      } as any);

      const call = mockPrisma.match.create.mock.calls[0][0];
      expect(call.data.visibility).toBe('PRIVATE');
    });

    it('deve criar partida com openForAnnotation=true', async () => {
      const { createMatch } = await import('@/services/matchService');

      mockPrisma.match.create.mockImplementation((args: any) => Promise.resolve({ id: 'new', ...args.data }));

      await createMatch({
        player1Id: 'p1',
        player2Id: 'p2',
        format: 'BEST_OF_3',
        openForAnnotation: true,
      } as any);

      const call = mockPrisma.match.create.mock.calls[0][0];
      expect(call.data.openForAnnotation).toBe(true);
    });

it('deve criar partida com scheduledAt', async () => {
      const { createMatch } = await import('@/services/matchService');

      mockPrisma.match.create.mockImplementation((args: any) => Promise.resolve({ id: 'new', ...args.data }));

      const scheduledDate = '2024-12-25T14:00:00Z';
      await createMatch({
        player1Id: 'p1',
        player2Id: 'p2',
        format: 'BEST_OF_3',
        scheduledAt: scheduledDate,
      } as any);

      const call = mockPrisma.match.create.mock.calls[0][0];
      expect(call.data.scheduledAt).toBe(scheduledDate);
    });

    it('deve criar partida com category JUVENIL e includeLet=true', async () => {
      const { createMatch } = await import('@/services/matchService');

      mockPrisma.match.create.mockImplementation((args: any) => Promise.resolve({ id: 'new', ...args.data }));

      await createMatch({
        player1Id: 'p1',
        player2Id: 'p2',
        format: 'BEST_OF_3',
        category: 'JUVENIL',
        includeLet: true,
      } as any);

      const call = mockPrisma.match.create.mock.calls[0][0];
      expect(call.data.category).toBe('JUVENIL');
      expect(call.data.includeLet).toBe(true);
    });

    it('deve criar partida com category INFANTIL sem includeLet', async () => {
      const { createMatch } = await import('@/services/matchService');

      mockPrisma.match.create.mockImplementation((args: any) => Promise.resolve({ id: 'new', ...args.data }));

      await createMatch({
        player1Id: 'p1',
        player2Id: 'p2',
        format: 'BEST_OF_3',
        category: 'INFANTIL',
      } as any);

      const call = mockPrisma.match.create.mock.calls[0][0];
      expect(call.data.category).toBe('INFANTIL');
      expect(call.data.includeLet).toBeNull();
    });

    it('deve criar partida com category VETERANO sem includeLet', async () => {
      const { createMatch } = await import('@/services/matchService');

      mockPrisma.match.create.mockImplementation((args: any) => Promise.resolve({ id: 'new', ...args.data }));

      await createMatch({
        player1Id: 'p1',
        player2Id: 'p2',
        format: 'BEST_OF_3',
        category: 'VETERANO',
      } as any);

      const call = mockPrisma.match.create.mock.calls[0][0];
      expect(call.data.category).toBe('VETERANO');
      expect(call.data.includeLet).toBeNull();
    });
  });
  });

  describe('transitionMatchState - CANNOT_FINISH validation', () => {
    it('deve retornar erro CANNOT_FINISH quando engine indica partida em andamento', async () => {
      const { transitionMatchState } = await import('@/services/matchService');

      mockPrisma.match.findFirst.mockResolvedValue({
        id: 'm1',
        state: 'IN_PROGRESS',
        player1Id: 'p1',
        player2Id: 'p2',
        format: 'BEST_OF_3',
        initialServerId: 'p1',
        scoreState: { sets: [{ player1: 6, player2: 4 }], isFinished: false, winner: null },
      });

      mockPrisma.match.update.mockResolvedValue({ id: 'm1' });

      const result = await transitionMatchState('m1', 'FINISHED');

      expect(result).toEqual({ error: "CANNOT_FINISH: Motor de pontuação indica partida em andamento" });
    });
  });

  describe('transitionMatchState - SCORE_REGRESSION validation', () => {
    it('deve retornar erro SCORE_REGRESSION quando novo setsWon é inferior ao stored', async () => {
      const { transitionMatchState } = await import('@/services/matchService');

      mockPrisma.match.findFirst.mockResolvedValue({
        id: 'm1',
        state: 'IN_PROGRESS',
        player1Id: 'p1',
        player2Id: 'p2',
        format: 'BEST_OF_3',
        initialServerId: 'p1',
        scoreState: { sets: [], setsWon: { player1: 1, player2: 0 }, isFinished: false, winner: null },
      });

      mockPrisma.match.update.mockResolvedValue({ id: 'm1' });

      const newScoreState = {
        sets: [],
        setsWon: { player1: 0, player2: 0 },
        currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
        server: 'player1',
        isFinished: false,
        winner: null,
        startedAt: null,
        secondServe: false,
      };

      const result = await transitionMatchState('m1', 'IN_PROGRESS', undefined, newScoreState);

      expect(result).toEqual({ error: "SCORE_REGRESSION: Placar não pode ser inferior ao estado atual" });
    });

    it('deve retornar erro SCORE_REGRESSION quando player2 setsWon é inferior', async () => {
      const { transitionMatchState } = await import('@/services/matchService');

      mockPrisma.match.findFirst.mockResolvedValue({
        id: 'm1',
        state: 'IN_PROGRESS',
        player1Id: 'p1',
        player2Id: 'p2',
        format: 'BEST_OF_3',
        initialServerId: 'p1',
        scoreState: { sets: [], setsWon: { player1: 0, player2: 1 }, isFinished: false, winner: null },
      });

      mockPrisma.match.update.mockResolvedValue({ id: 'm1' });

      const newScoreState = {
        sets: [],
        setsWon: { player1: 0, player2: 0 },
        currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
        server: 'player1',
        isFinished: false,
        winner: null,
        startedAt: null,
        secondServe: false,
      };

      const result = await transitionMatchState('m1', 'IN_PROGRESS', undefined, newScoreState);

      expect(result).toEqual({ error: "SCORE_REGRESSION: Placar não pode ser inferior ao estado atual" });
    });

    it('deve permitir edição quando setsWon é igual mas o último set de games mudou', async () => {
      const { transitionMatchState } = await import('@/services/matchService');

      mockPrisma.match.findFirst.mockResolvedValue({
        id: 'm1',
        state: 'IN_PROGRESS',
        player1Id: 'p1',
        player2Id: 'p2',
        format: 'BEST_OF_3',
        initialServerId: 'p1',
        scoreState: {
          sets: [{ player1: 3, player2: 2, isTiebreak: false, tiebreakScore: null }],
          setsWon: { player1: 0, player2: 0 },
          currentGame: { player1: 3, player2: 3, isDeuce: true, advantage: 'player1', secondServe: false },
          server: 'player1',
          isFinished: false,
          winner: null,
          startedAt: null,
          secondServe: false,
        },
      });

      mockPrisma.match.update.mockResolvedValue({ id: 'm1' });

      const newScoreState = {
        sets: [{ player1: 3, player2: 3, isTiebreak: false, tiebreakScore: null }],
        setsWon: { player1: 0, player2: 0 },
        currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
        server: 'player1',
        isFinished: false,
        winner: null,
        startedAt: null,
        secondServe: false,
      };

      const result = await transitionMatchState('m1', 'IN_PROGRESS', undefined, newScoreState);

      expect(result).not.toEqual(
        expect.objectContaining({
          error: expect.stringContaining('SCORE_REGRESSION'),
        })
      );
    });
  });

  describe('transitionMatchState - allowScoreEdit bypass (Edit Score)', () => {
    it('deve permitir reducao do currentGame quando allowScoreEdit=true (mesmo ultimo set)', async () => {
      const { transitionMatchState } = await import('@/services/matchService');

      mockPrisma.match.findFirst.mockResolvedValue({
        id: 'm1',
        state: 'IN_PROGRESS',
        player1Id: 'p1',
        player2Id: 'p2',
        format: 'BEST_OF_5',
        initialServerId: 'p1',
        scoreState: {
          sets: [
            { player1: 6, player2: 1, isTiebreak: false, tiebreakScore: null },
            { player1: 5, player2: 7, isTiebreak: false, tiebreakScore: null },
            { player1: 0, player2: 2, isTiebreak: false, tiebreakScore: null },
          ],
          setsWon: { player1: 1, player2: 1 },
          currentGame: { player1: 2, player2: 3, isDeuce: false, advantage: null, secondServe: false },
          server: 'player1',
          isFinished: false,
          winner: null,
          startedAt: null,
          secondServe: false,
        },
      });
      mockPrisma.match.update.mockResolvedValue({ id: 'm1' });

      const editScoreState = {
        sets: [
          { player1: 6, player2: 1, isTiebreak: false, tiebreakScore: null },
          { player1: 5, player2: 7, isTiebreak: false, tiebreakScore: null },
          { player1: 0, player2: 2, isTiebreak: false, tiebreakScore: null },
        ],
        setsWon: { player1: 1, player2: 1 },
        currentGame: { player1: 0, player2: 1, isDeuce: false, advantage: null, secondServe: false },
        server: 'player1',
        isFinished: false,
        winner: null,
        startedAt: Date.now(),
        secondServe: false,
      };

      const result = await transitionMatchState(
        'm1', 'IN_PROGRESS', undefined, editScoreState,
        { allowScoreEdit: true },
      );

      expect(result).not.toHaveProperty('error');
    });

    it('deve permitir reducao em tie-break quando allowScoreEdit=true', async () => {
      const { transitionMatchState } = await import('@/services/matchService');

      mockPrisma.match.findFirst.mockResolvedValue({
        id: 'm1',
        state: 'IN_PROGRESS',
        player1Id: 'p1',
        player2Id: 'p2',
        format: 'BEST_OF_3_MATCH_TB',
        initialServerId: 'p1',
        scoreState: {
          sets: [
            { player1: 6, player2: 1, isTiebreak: false, tiebreakScore: null },
            { player1: 4, player2: 6, isTiebreak: false, tiebreakScore: null },
            { player1: 0, player2: 0, isTiebreak: true, tiebreakScore: { player1: 8, player2: 5 } },
          ],
          setsWon: { player1: 1, player2: 1 },
          currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
          server: 'player1',
          isFinished: false,
          winner: null,
          startedAt: null,
          secondServe: false,
        },
      });
      mockPrisma.match.update.mockResolvedValue({ id: 'm1' });

      const editScoreState = {
        sets: [
          { player1: 6, player2: 1, isTiebreak: false, tiebreakScore: null },
          { player1: 4, player2: 6, isTiebreak: false, tiebreakScore: null },
          { player1: 0, player2: 0, isTiebreak: true, tiebreakScore: { player1: 2, player2: 1 } },
        ],
        setsWon: { player1: 1, player2: 1 },
        currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
        server: 'player1',
        isFinished: false,
        winner: null,
        startedAt: Date.now(),
        secondServe: false,
      };

      const result = await transitionMatchState(
        'm1', 'IN_PROGRESS', undefined, editScoreState,
        { allowScoreEdit: true },
      );

      expect(result).not.toHaveProperty('error');
    });

    it('deve BLOQUEAR reducao de setsWon mesmo com allowScoreEdit=true (protecao mantida)', async () => {
      const { transitionMatchState } = await import('@/services/matchService');

      mockPrisma.match.findFirst.mockResolvedValue({
        id: 'm1',
        state: 'IN_PROGRESS',
        player1Id: 'p1',
        player2Id: 'p2',
        format: 'BEST_OF_3',
        initialServerId: 'p1',
        scoreState: {
          sets: [],
          setsWon: { player1: 1, player2: 0 },
          currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
          server: 'player1',
          isFinished: false,
          winner: null,
          startedAt: null,
          secondServe: false,
        },
      });
      mockPrisma.match.update.mockResolvedValue({ id: 'm1' });

      const editScoreState = {
        sets: [],
        setsWon: { player1: 0, player2: 0 },
        currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
        server: 'player1',
        isFinished: false,
        winner: null,
        startedAt: Date.now(),
        secondServe: false,
      };

      const result = await transitionMatchState(
        'm1', 'IN_PROGRESS', undefined, editScoreState,
        { allowScoreEdit: true },
      );

      expect(result).toEqual({
        error: "SCORE_REGRESSION: Placar não pode ser inferior ao estado atual",
      });
    });

    it('deve BLOQUEAR reducao de currentGame quando allowScoreEdit=false (comportamento legacy mantido)', async () => {
      const { transitionMatchState } = await import('@/services/matchService');

      mockPrisma.match.findFirst.mockResolvedValue({
        id: 'm1',
        state: 'IN_PROGRESS',
        player1Id: 'p1',
        player2Id: 'p2',
        format: 'BEST_OF_5',
        initialServerId: 'p1',
        scoreState: {
          sets: [
            { player1: 6, player2: 1, isTiebreak: false, tiebreakScore: null },
            { player1: 5, player2: 7, isTiebreak: false, tiebreakScore: null },
            { player1: 0, player2: 2, isTiebreak: false, tiebreakScore: null },
          ],
          setsWon: { player1: 1, player2: 1 },
          currentGame: { player1: 2, player2: 3, isDeuce: false, advantage: null, secondServe: false },
          server: 'player1',
          isFinished: false,
          winner: null,
          startedAt: null,
          secondServe: false,
        },
      });
      mockPrisma.match.update.mockResolvedValue({ id: 'm1' });

      const editScoreState = {
        sets: [
          { player1: 6, player2: 1, isTiebreak: false, tiebreakScore: null },
          { player1: 5, player2: 7, isTiebreak: false, tiebreakScore: null },
          { player1: 0, player2: 2, isTiebreak: false, tiebreakScore: null },
        ],
        setsWon: { player1: 1, player2: 1 },
        currentGame: { player1: 0, player2: 1, isDeuce: false, advantage: null, secondServe: false },
        server: 'player1',
        isFinished: false,
        winner: null,
        startedAt: Date.now(),
        secondServe: false,
      };

      const result = await transitionMatchState(
        'm1', 'IN_PROGRESS', undefined, editScoreState,
      );

      expect(result).toEqual({
        error: "SCORE_REGRESSION: Placar não pode ser inferior ao estado atual",
      });
    });
  });

  describe('transitionMatchState - allowScoreEdit bypass (Edit Score)', () => {
    it('deve permitir reducao do currentGame quando allowScoreEdit=true (mesmo ultimo set)', async () => {
      const { transitionMatchState } = await import('@/services/matchService');

      mockPrisma.match.findFirst.mockResolvedValue({
        id: 'm1',
        state: 'IN_PROGRESS',
        player1Id: 'p1',
        player2Id: 'p2',
        format: 'BEST_OF_5',
        initialServerId: 'p1',
        scoreState: {
          sets: [
            { player1: 6, player2: 1, isTiebreak: false, tiebreakScore: null },
            { player1: 5, player2: 7, isTiebreak: false, tiebreakScore: null },
            { player1: 0, player2: 2, isTiebreak: false, tiebreakScore: null },
          ],
          setsWon: { player1: 1, player2: 1 },
          currentGame: { player1: 2, player2: 3, isDeuce: false, advantage: null, secondServe: false },
          server: 'player1',
          isFinished: false,
          winner: null,
          startedAt: null,
          secondServe: false,
        },
      });
      mockPrisma.match.update.mockResolvedValue({ id: 'm1' });

      const editScoreState = {
        sets: [
          { player1: 6, player2: 1, isTiebreak: false, tiebreakScore: null },
          { player1: 5, player2: 7, isTiebreak: false, tiebreakScore: null },
          { player1: 0, player2: 2, isTiebreak: false, tiebreakScore: null },
        ],
        setsWon: { player1: 1, player2: 1 },
        currentGame: { player1: 0, player2: 1, isDeuce: false, advantage: null, secondServe: false },
        server: 'player1',
        isFinished: false,
        winner: null,
        startedAt: Date.now(),
        secondServe: false,
      };

      const result = await transitionMatchState(
        'm1', 'IN_PROGRESS', undefined, editScoreState,
        { allowScoreEdit: true },
      );

      expect(result).not.toHaveProperty('error');
    });

    it('deve permitir reducao em tie-break quando allowScoreEdit=true', async () => {
      const { transitionMatchState } = await import('@/services/matchService');

      mockPrisma.match.findFirst.mockResolvedValue({
        id: 'm1',
        state: 'IN_PROGRESS',
        player1Id: 'p1',
        player2Id: 'p2',
        format: 'BEST_OF_3_MATCH_TB',
        initialServerId: 'p1',
        scoreState: {
          sets: [
            { player1: 6, player2: 1, isTiebreak: false, tiebreakScore: null },
            { player1: 4, player2: 6, isTiebreak: false, tiebreakScore: null },
            { player1: 0, player2: 0, isTiebreak: true, tiebreakScore: { player1: 8, player2: 5 } },
          ],
          setsWon: { player1: 1, player2: 1 },
          currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
          server: 'player1',
          isFinished: false,
          winner: null,
          startedAt: null,
          secondServe: false,
        },
      });
      mockPrisma.match.update.mockResolvedValue({ id: 'm1' });

      const editScoreState = {
        sets: [
          { player1: 6, player2: 1, isTiebreak: false, tiebreakScore: null },
          { player1: 4, player2: 6, isTiebreak: false, tiebreakScore: null },
          { player1: 0, player2: 0, isTiebreak: true, tiebreakScore: { player1: 2, player2: 1 } },
        ],
        setsWon: { player1: 1, player2: 1 },
        currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
        server: 'player1',
        isFinished: false,
        winner: null,
        startedAt: Date.now(),
        secondServe: false,
      };

      const result = await transitionMatchState(
        'm1', 'IN_PROGRESS', undefined, editScoreState,
        { allowScoreEdit: true },
      );

      expect(result).not.toHaveProperty('error');
    });

    it('deve BLOQUEAR reducao de setsWon mesmo com allowScoreEdit=true (protecao mantida)', async () => {
      const { transitionMatchState } = await import('@/services/matchService');

      mockPrisma.match.findFirst.mockResolvedValue({
        id: 'm1',
        state: 'IN_PROGRESS',
        player1Id: 'p1',
        player2Id: 'p2',
        format: 'BEST_OF_3',
        initialServerId: 'p1',
        scoreState: {
          sets: [],
          setsWon: { player1: 1, player2: 0 },
          currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
          server: 'player1',
          isFinished: false,
          winner: null,
          startedAt: null,
          secondServe: false,
        },
      });
      mockPrisma.match.update.mockResolvedValue({ id: 'm1' });

      const editScoreState = {
        sets: [],
        setsWon: { player1: 0, player2: 0 },
        currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
        server: 'player1',
        isFinished: false,
        winner: null,
        startedAt: Date.now(),
        secondServe: false,
      };

      const result = await transitionMatchState(
        'm1', 'IN_PROGRESS', undefined, editScoreState,
        { allowScoreEdit: true },
      );

      expect(result).toEqual({
        error: "SCORE_REGRESSION: Placar não pode ser inferior ao estado atual",
      });
    });

    it('deve BLOQUEAR reducao de currentGame quando allowScoreEdit=false (comportamento legacy mantido)', async () => {
      const { transitionMatchState } = await import('@/services/matchService');

      mockPrisma.match.findFirst.mockResolvedValue({
        id: 'm1',
        state: 'IN_PROGRESS',
        player1Id: 'p1',
        player2Id: 'p2',
        format: 'BEST_OF_5',
        initialServerId: 'p1',
        scoreState: {
          sets: [
            { player1: 6, player2: 1, isTiebreak: false, tiebreakScore: null },
            { player1: 5, player2: 7, isTiebreak: false, tiebreakScore: null },
            { player1: 0, player2: 2, isTiebreak: false, tiebreakScore: null },
          ],
          setsWon: { player1: 1, player2: 1 },
          currentGame: { player1: 2, player2: 3, isDeuce: false, advantage: null, secondServe: false },
          server: 'player1',
          isFinished: false,
          winner: null,
          startedAt: null,
          secondServe: false,
        },
      });
      mockPrisma.match.update.mockResolvedValue({ id: 'm1' });

      const editScoreState = {
        sets: [
          { player1: 6, player2: 1, isTiebreak: false, tiebreakScore: null },
          { player1: 5, player2: 7, isTiebreak: false, tiebreakScore: null },
          { player1: 0, player2: 2, isTiebreak: false, tiebreakScore: null },
        ],
        setsWon: { player1: 1, player2: 1 },
        currentGame: { player1: 0, player2: 1, isDeuce: false, advantage: null, secondServe: false },
        server: 'player1',
        isFinished: false,
        winner: null,
        startedAt: Date.now(),
        secondServe: false,
      };

      const result = await transitionMatchState(
        'm1', 'IN_PROGRESS', undefined, editScoreState,
      );

      expect(result).toEqual({
        error: "SCORE_REGRESSION: Placar não pode ser inferior ao estado atual",
      });
    });
  });
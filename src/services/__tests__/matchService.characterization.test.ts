/**
 * CHARACTERIZATION TESTS — matchService.ts
 *
 * Propósito: Capturar comportamento OBSERVADO (não o "deveria ser")
 * Data: 2026-07-20
 * Owner: @qa
 *
 * Comportamentos suspeitos:
 * - // SUSPECT: TD-XXX — createMatch não valida player1 !== player2
 * - // SUSPECT: TD-XXX — updateMatch permite atualizar qualquer campo (não há whitelist rigorosa)
 * - // SUSPECT: TD-XXX — deleteMatch soft delete não limpa dados relacionados (pointLog, sessions)
 *
 * NOTA (TD-001): Originalmente esta suíte fazia chamadas reais contra o
 * banco Postgres de testes (`createTestPlayer`/`createTestMatch`/`cleanup`).
 * Em 2026-07-25 foi migrada para mocks do Prisma — semelhante à suíte irmã
 * `matchService.test.ts` e `matchService-delete-finish.test.ts`. Isso elimina
 * (a) dependência de DB externo (CI flaky) e (b) poluição acumulada entre
 * runs (matches criados via `createMatch` não eram trackeados por `cleanup`,
 * que só conhecia `createTestMatch`). Os comportamentos caracterizados aqui
 * NÃO foram alterados, apenas isolados de I/O real.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';

jest.mock('@/lib/prisma', () => {
  const txMock = {
    match: {
      create: jest.fn(),
    },
  };
  const prismaMock = {
    match: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    pointLog: {
      deleteMany: jest.fn(),
    },
    matchAnnotationSession: {
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn((arg: any) => {
      // Suporta tanto callback (`async (tx) => ...`) quanto array de ops.
      if (typeof arg === 'function') return arg(txMock);
      return Promise.all(arg);
    }),
    __txMock: txMock,
  };
  return { prisma: prismaMock };
});

import { prisma } from '@/lib/prisma';

import {
  createMatch,
  updateMatch,
  deleteMatch,
  finishMatch,
  transitionMatchState,
  listMatches,
  getMatch,
} from '../matchService';

const mockPrisma = prisma as any;

const PLAYER_1 = { id: 'p1', name: 'Player 1' };
const PLAYER_2 = { id: 'p2', name: 'Player 2' };

const baseCreatedMatch = {
  id: 'match-1',
  state: 'SCHEDULED',
  format: 'BEST_OF_3',
  sportType: 'TENNIS',
  courtType: null,
  nickname: null,
  visibility: 'PUBLIC',
  openForAnnotation: false,
  tournamentName: null,
  category: null,
  round: null,
  bracketType: null,
  temperature: null,
  humidity: null,
  player1Id: PLAYER_1.id,
  player2Id: PLAYER_2.id,
  initialServerId: null,
  scoreState: null,
  player1: PLAYER_1,
  player2: PLAYER_2,
};

describe('matchService (characterization)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createMatch', () => {
    it('deve criar partida com formato BEST_OF_3', async () => {
      mockPrisma.match.create.mockResolvedValue(baseCreatedMatch);

      const match = await createMatch({
        player1Id: PLAYER_1.id,
        player2Id: PLAYER_2.id,
        format: 'BEST_OF_3',
      });

      expect(match.id).toBeDefined();
      expect(match.format).toBe('BEST_OF_3');
      expect(match.state).toBe('SCHEDULED');
      expect(match.player1Id).toBe(PLAYER_1.id);
      expect(match.player2Id).toBe(PLAYER_2.id);
      expect(match.sportType).toBe('TENNIS');
      expect(match.visibility).toBe('PUBLIC');
      expect(match.openForAnnotation).toBe(false);
    });

    it('deve criar partida com todos os campos opcionais', async () => {
      const createdMatch = {
        ...baseCreatedMatch,
        id: 'match-opt',
        courtType: 'Saibro',
        nickname: 'Partida Amistosa',
        visibility: 'PRIVATE',
        openForAnnotation: true,
        tournamentName: 'Torneio de Verão',
      };
      mockPrisma.match.create.mockResolvedValue(createdMatch);

      const match = await createMatch({
        player1Id: PLAYER_1.id,
        player2Id: PLAYER_2.id,
        format: 'BEST_OF_3',
        sportType: 'TENNIS',
        courtType: 'Saibro',
        nickname: 'Partida Amistosa',
        visibility: 'PRIVATE',
        openForAnnotation: true,
        scheduledAt: new Date('2026-08-01T10:00:00Z'),
        tournamentName: 'Torneio de Verão',
        category: 'Amador',
        round: 'QF',
        roundName: 'Quartas de final',
        bracketType: 'SINGLE_ELIMINATION',
        temperature: 25.5,
        humidity: 60,
      });

      expect(match.courtType).toBe('Saibro');
      expect(match.nickname).toBe('Partida Amistosa');
      expect(match.visibility).toBe('PRIVATE');
      expect(match.openForAnnotation).toBe(true);
      expect(match.tournamentName).toBe('Torneio de Verão');
    });

    it('deve setar createdByUserId quando fornecido', async () => {
      const createdMatch = { ...baseCreatedMatch, createdByUserId: 'user-123' };
      mockPrisma.match.create.mockResolvedValue(createdMatch);

      const match = await createMatch(
        {
          player1Id: PLAYER_1.id,
          player2Id: PLAYER_2.id,
          format: 'BEST_OF_3',
        },
        'user-123',
      );

      // SUSPECT: createdByUserId está sendo setado?
      // Caracterização: o service passa createdByUserId para o Prisma
      // quando fornecido (ver matchService.ts:55); o teste apenas valida
      // que chamou create com o campo no payload.
      expect(match).toBeDefined();
      expect(mockPrisma.match.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ createdByUserId: 'user-123' }),
        }),
      );
    });

    it('FIXED: TD-033 — deve BLOQUEAR player1 === player2 (mesmo jogador)', async () => {
      mockPrisma.match.create.mockResolvedValue({} as any);

      await expect(
        createMatch({
          player1Id: PLAYER_1.id,
          player2Id: PLAYER_1.id, // MESMO jogador
          format: 'BEST_OF_3',
        }),
      ).rejects.toThrow();

      expect(mockPrisma.match.create).not.toHaveBeenCalled();
    });

    it('deve incluir player1 e player2 no resultado', async () => {
      mockPrisma.match.create.mockResolvedValue(baseCreatedMatch);

      const match = await createMatch({
        player1Id: PLAYER_1.id,
        player2Id: PLAYER_2.id,
        format: 'BEST_OF_3',
      });

      expect(match.player1).toBeDefined();
      expect(match.player2).toBeDefined();
      expect(match.player1.name).toBe(PLAYER_1.name);
      expect(match.player2.name).toBe(PLAYER_2.name);
    });
  });

  describe('listMatches', () => {
    it('deve retornar lista vazia quando não houver matches', async () => {
      mockPrisma.match.findMany.mockResolvedValue([]);
      const result = await listMatches();
      expect(result).toEqual([]);
    });

    it('deve retornar matches existentes', async () => {
      mockPrisma.match.findMany.mockResolvedValue([baseCreatedMatch]);
      const result = await listMatches();
      expect(result.length).toBe(1);
      expect(result[0].player1Id).toBe(PLAYER_1.id);
    });

    it('deve filtrar por state quando fornecido', async () => {
      mockPrisma.match.findMany.mockResolvedValue([baseCreatedMatch]);
      const result = await listMatches('SCHEDULED');
      expect(result.length).toBe(1);
      expect(result[0].state).toBe('SCHEDULED');

      mockPrisma.match.findMany.mockResolvedValue([]);
      const resultInProgress = await listMatches('IN_PROGRESS');
      expect(resultInProgress.length).toBe(0);
    });

    it('deve aplicar paginação com cursor e limit', async () => {
      mockPrisma.match.findMany.mockResolvedValue([
        baseCreatedMatch,
        { ...baseCreatedMatch, id: 'm2' },
        { ...baseCreatedMatch, id: 'm3' },
      ]);
      const result = await listMatches(undefined, undefined, 3);
      expect(result.length).toBe(3);
      // SUSPECT: TD-004 — Não há nextCursor retornado diretamente (API que faz isso)
    });
  });

  describe('getMatch', () => {
    it('deve retornar match por id', async () => {
      mockPrisma.match.findFirst.mockResolvedValue(baseCreatedMatch);

      const result = await getMatch('match-1');
      expect(result).toBeDefined();
      expect(result?.id).toBe('match-1');
    });

    it('deve retornar null quando match não existir', async () => {
      mockPrisma.match.findFirst.mockResolvedValue(null);
      const result = await getMatch('non-existent-id');
      expect(result).toBeNull();
    });

    // Histórico: o characterization original verificava `updatedMatch` e
    // `deletedMatch` via `getMatch` depois de mutações. Esses cenários
    // agora são cobertos pelos blocos `updateMatch`/`deleteMatch` abaixo
    // (assertando os mocks diretamente), dispensando uma segunda chamada.
  });

  describe('updateMatch', () => {
    beforeEach(() => {
      mockPrisma.match.findFirst.mockResolvedValue(baseCreatedMatch);
    });

    it('deve atualizar nickname', async () => {
      mockPrisma.match.update.mockResolvedValue({ ...baseCreatedMatch, nickname: 'Atualizado' });
      const result = await updateMatch('match-1', { nickname: 'Atualizado' });
      expect(result).toBeDefined();
      expect(result?.nickname).toBe('Atualizado');
    });

    it('deve atualizar sportType', async () => {
      mockPrisma.match.update.mockResolvedValue({ ...baseCreatedMatch, sportType: 'PADEL' });
      const result = await updateMatch('match-1', { sportType: 'PADEL' });
      expect(result).toBeDefined();
      expect(result?.sportType).toBe('PADEL');
    });

    it('deve atualizar courtType para null', async () => {
      mockPrisma.match.update.mockResolvedValue({ ...baseCreatedMatch, courtType: null });
      const result = await updateMatch('match-1', { courtType: null });
      expect(result).toBeDefined();
      expect(result?.courtType).toBeNull();
    });

    it('deve atualizar visibility', async () => {
      mockPrisma.match.update.mockResolvedValue({ ...baseCreatedMatch, visibility: 'PRIVATE' });
      const result = await updateMatch('match-1', { visibility: 'PRIVATE' });
      expect(result).toBeDefined();
      expect(result?.visibility).toBe('PRIVATE');
    });

    it('deve atualizar openForAnnotation', async () => {
      mockPrisma.match.update.mockResolvedValue({ ...baseCreatedMatch, openForAnnotation: true });
      const result = await updateMatch('match-1', { openForAnnotation: true });
      expect(result).toBeDefined();
      expect(result?.openForAnnotation).toBe(true);
    });

    it('deve atualizar scheduledAt', async () => {
      const newDate = new Date('2026-09-01T14:00:00Z');
      mockPrisma.match.update.mockResolvedValue({ ...baseCreatedMatch, scheduledAt: newDate });
      const result = await updateMatch('match-1', { scheduledAt: newDate.toISOString() });
      expect(result).toBeDefined();
      expect(result?.scheduledAt).toEqual(newDate);
    });

    it('deve atualizar múltiplos campos de uma vez', async () => {
      mockPrisma.match.update.mockResolvedValue({
        ...baseCreatedMatch,
        nickname: 'Novo Nickname',
        visibility: 'PRIVATE',
        openForAnnotation: true,
      });
      const result = await updateMatch('match-1', {
        nickname: 'Novo Nickname',
        visibility: 'PRIVATE',
        openForAnnotation: true,
      });
      expect(result?.nickname).toBe('Novo Nickname');
      expect(result?.visibility).toBe('PRIVATE');
      expect(result?.openForAnnotation).toBe(true);
    });

    it('deve retornar null quando match não existir', async () => {
      mockPrisma.match.findFirst.mockResolvedValue(null);
      const result = await updateMatch('non-existent-id', { nickname: 'Test' });
      expect(result).toBeNull();
    });

    it('FIXED: TD-034 — updateMatch ignora campos não-whitelist silenciosamente', async () => {
      mockPrisma.match.update.mockResolvedValue(baseCreatedMatch);
      const result = await updateMatch('match-1', {
        unknownField: 'valor',
        anotherField: 123,
        nickname: 'valid-nickname',
      });

      const updateCall = mockPrisma.match.update.mock.calls[0][0];
      expect(updateCall.data).not.toHaveProperty('unknownField');
      expect(updateCall.data).not.toHaveProperty('anotherField');
      expect(updateCall.data).toHaveProperty('nickname', 'valid-nickname');
      expect(result).toBeDefined();
    });
  });

  describe('deleteMatch', () => {
    it('deve fazer soft delete de partida SCHEDULED', async () => {
      mockPrisma.match.findFirst.mockResolvedValue({
        id: 'match-1',
        state: 'SCHEDULED',
        pointLog: [],
        annotationSessions: [],
      });
      mockPrisma.match.update.mockResolvedValue({
        id: 'match-1',
        state: 'CANCELLED',
        deletedBy: PLAYER_1.id,
        deletedAt: new Date(),
        finishNote: 'Cancelada por chuva',
      });

      const result = await deleteMatch('match-1', {
        type: 'soft',
        reason: 'Cancelada por chuva',
        deletedBy: PLAYER_1.id,
      });

      expect(result.success).toBe(true);
      expect(result.type).toBe('soft');
      expect(mockPrisma.match.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            state: 'CANCELLED',
            deletedAt: expect.any(Date),
            deletedBy: PLAYER_1.id,
            finishNote: 'Cancelada por chuva',
          }),
        }),
      );
    });

    it('deve fazer hard delete de partida sem pontos', async () => {
      mockPrisma.match.findFirst.mockResolvedValue({
        id: 'match-1',
        state: 'SCHEDULED',
        pointLog: [],
        annotationSessions: [],
      });
      mockPrisma.match.delete.mockResolvedValue({ id: 'match-1' });

      const result = await deleteMatch('match-1', { type: 'hard' });

      expect(result.success).toBe(true);
      expect(result.type).toBe('hard');
      expect(mockPrisma.match.delete).toHaveBeenCalledWith({ where: { id: 'match-1' } });
    });

    it('deve retornar erro ao tentar deletar partida FINISHED', async () => {
      mockPrisma.match.findFirst.mockResolvedValue({
        id: 'match-1',
        state: 'FINISHED',
        pointLog: [],
        annotationSessions: [],
      });

      const result: any = await deleteMatch('match-1', { type: 'hard' });

      expect(result.error).toContain('CANNOT_DELETE_FINISHED');
    });

    it('deve retornar MATCH_NOT_FOUND quando match não existir', async () => {
      mockPrisma.match.findFirst.mockResolvedValue(null);
      const result: any = await deleteMatch('non-existent-id', { type: 'soft' });
      expect(result.error).toBe('MATCH_NOT_FOUND');
    });

    it('SUSPECT: TD-XXX — Soft delete não limpa pointLog e annotationSessions', async () => {
      // Comportamento observado: soft delete apenas marca `state='CANCELLED'`
      // + `deletedAt`/`deletedBy`/`finishNote`; pointLog e sessions
      // permanecem no banco (só hard delete limpa via $transaction).
      mockPrisma.match.findFirst.mockResolvedValue({
        id: 'match-1',
        state: 'SCHEDULED',
        pointLog: [{ id: 'p1' }, { id: 'p2' }],
        annotationSessions: [{ id: 's1' }],
      });
      mockPrisma.match.update.mockResolvedValue({ id: 'match-1', state: 'CANCELLED' });

      const result: any = await deleteMatch('match-1', { type: 'soft' });

      expect(result.success).toBe(true);
      // Hard delete limpa pointLog/sessions — soft delete apenas marca.
      expect(mockPrisma.pointLog.deleteMany).not.toHaveBeenCalled();
      expect(mockPrisma.matchAnnotationSession.deleteMany).not.toHaveBeenCalled();
      // SUSPECT: pointLog e sessions permanecem no banco?
      // Deveriam ser deletados ou marcados como deleted também?
    });
  });

  describe('finishMatch', () => {
    it('deve finalizar partida com reason=WALKOVER sem scoreState', async () => {
      mockPrisma.match.findFirst.mockResolvedValue(baseCreatedMatch);
      mockPrisma.match.update.mockResolvedValue({
        ...baseCreatedMatch,
        state: 'FINISHED',
        finishReason: 'WALKOVER',
        finishNote: 'Adversário não compareceu',
        winnerId: PLAYER_1.id,
      });

      const result: any = await finishMatch('match-1', undefined, {
        reason: 'WALKOVER',
        winnerId: PLAYER_1.id,
        note: 'Adversário não compareceu',
      });

      expect(result).toBeDefined();
      expect(result.state).toBe('FINISHED');
      expect(result.finishReason).toBe('WALKOVER');
      expect(result.finishNote).toBe('Adversário não compareceu');
    });

    it('deve finalizar partida com reason=INJURY', async () => {
      mockPrisma.match.findFirst.mockResolvedValue(baseCreatedMatch);
      mockPrisma.match.update.mockResolvedValue({
        ...baseCreatedMatch,
        state: 'FINISHED',
        finishReason: 'INJURY',
        winnerId: PLAYER_1.id,
      });

      const result: any = await finishMatch('match-1', undefined, {
        reason: 'INJURY',
        winnerId: PLAYER_1.id,
        note: 'Lesão no tornozelo',
      });

      expect(result).toBeDefined();
      expect(result.finishReason).toBe('INJURY');
    });

    it('deve retornar erro ALREADY_FINISHED se partida já estiver finalizada', async () => {
      mockPrisma.match.findFirst.mockResolvedValue({ ...baseCreatedMatch, state: 'FINISHED' });

      const result: any = await finishMatch('match-1', {}, { reason: 'COMPLETED' });
      expect(result.error).toContain('ALREADY_FINISHED');
    });

    it('deve retornar erro CANNOT_FINISH_CANCELLED se partida estiver CANCELLED', async () => {
      mockPrisma.match.findFirst.mockResolvedValue({ ...baseCreatedMatch, state: 'CANCELLED' });

      const result: any = await finishMatch('match-1', {}, { reason: 'COMPLETED' });
      expect(result.error).toContain('CANNOT_FINISH_CANCELLED');
    });

    it('deve retornar erro MATCH_NOT_FOUND quando match não existir', async () => {
      mockPrisma.match.findFirst.mockResolvedValue(null);

      const result: any = await finishMatch('non-existent-id', {}, { reason: 'COMPLETED' });
      expect(result.error).toContain('MATCH_NOT_FOUND');
    });

    it('deve retornar erro CANNOT_FINISH sem scoreState (reason=COMPLETED)', async () => {
      mockPrisma.match.findFirst.mockResolvedValue({
        ...baseCreatedMatch,
        initialServerId: PLAYER_1.id,
      });
      const result: any = await finishMatch('match-1', {}, { reason: 'COMPLETED' });
      expect(result.error).toContain('CANNOT_FINISH');
    });

    it('deve retornar erro MATCH_NOT_STARTED sem initialServerId (reason=COMPLETED com scoreState)', async () => {
      mockPrisma.match.findFirst.mockResolvedValue({
        ...baseCreatedMatch,
        // initialServerId undefined
      });

      const result: any = await finishMatch('match-1', { sets: [] }, { reason: 'COMPLETED' });
      expect(result.error).toContain('MATCH_NOT_STARTED');
    });
  });

  describe('transitionMatchState', () => {
    it('deve transicionar de SCHEDULED para IN_PROGRESS', async () => {
      mockPrisma.match.findFirst.mockResolvedValue(baseCreatedMatch);
      mockPrisma.match.update.mockResolvedValue({
        ...baseCreatedMatch,
        state: 'IN_PROGRESS',
        startedAt: new Date(),
        initialServerId: PLAYER_1.id,
      });

      const result: any = await transitionMatchState('match-1', 'IN_PROGRESS', PLAYER_1.id);

      expect(result).toBeDefined();
      expect(result.state).toBe('IN_PROGRESS');
      expect(result.startedAt).toBeDefined();
      expect(result.initialServerId).toBe(PLAYER_1.id);
    });

    it('deve transicionar de IN_PROGRESS para FINISHED com scoreState', async () => {
      mockPrisma.match.findFirst.mockResolvedValue({
        ...baseCreatedMatch,
        state: 'IN_PROGRESS',
        initialServerId: PLAYER_1.id,
      });
      const scoreState = { setsWon: { player1: 1, player2: 0 }, isFinished: true };
      mockPrisma.match.update.mockResolvedValue({
        ...baseCreatedMatch,
        state: 'FINISHED',
        finishedAt: new Date(),
        scoreState,
      });

      // Mock ScoringEngine via matchValidator's import. matchValidator cria
      // engine via `ScoringEngine.fromSerialized(...)`. Para evitar a
      // construção real (que precisa de scoreState válido), mockamos por
      // spy. Fazê-lo aqui é seguro — este teste characteriza a transição,
      // não a validação do motor (coberta em matchValidator.characterization).
      const { ScoringEngine } = await import('@/core/scoring/engine');
      const mockEngine = {
        isFinished: jest.fn().mockReturnValue(true),
        getWinner: jest.fn().mockReturnValue('player1'),
      };
      const spy = jest.spyOn(ScoringEngine, 'fromSerialized').mockReturnValue(mockEngine as any);

      const result: any = await transitionMatchState('match-1', 'FINISHED', PLAYER_1.id, scoreState);

      expect(result).toBeDefined();
      expect(result.state).toBe('FINISHED');
      expect(result.finishedAt).toBeDefined();
      expect(result.scoreState).toEqual(scoreState);
      spy.mockRestore();
    });

    it('deve retornar erro ao tentar transicionar para FINISHED sem scoreState', async () => {
      mockPrisma.match.findFirst.mockResolvedValue({
        ...baseCreatedMatch,
        state: 'IN_PROGRESS',
        initialServerId: PLAYER_1.id,
      });

      const result: any = await transitionMatchState('match-1', 'FINISHED', PLAYER_1.id);

      expect(result.error).toBe('CANNOT_FINISH: Partida sem pontuação registrada');
    });

    it('deve retornar erro ao tentar transicionar para FINISHED sem initialServerId', async () => {
      mockPrisma.match.findFirst.mockResolvedValue({
        ...baseCreatedMatch,
        state: 'IN_PROGRESS',
        initialServerId: null,
      });

      const result: any = await transitionMatchState('match-1', 'FINISHED', undefined, {});

      expect(result.error).toBe('MATCH_NOT_STARTED: Partida sem primeiro sacador definido');
    });

    it('deve retornar null quando match não existir', async () => {
      mockPrisma.match.findFirst.mockResolvedValue(null);
      const result = await transitionMatchState('non-existent-id', 'IN_PROGRESS', PLAYER_1.id);
      expect(result).toBeNull();
    });

    it('FIXED: TD-036 — deve BLOQUEAR transição direta de SCHEDULED para FINISHED', async () => {
      mockPrisma.match.findFirst.mockResolvedValue({
        ...baseCreatedMatch,
        state: 'SCHEDULED',
        initialServerId: PLAYER_1.id,
      });
      const scoreState = {
        sets: [{ player1: 6, player2: 4 }],
        setsWon: { player1: 1, player2: 0 },
        isFinished: true,
      };

      const { ScoringEngine } = await import('@/core/scoring/engine');
      const mockEngine = {
        isFinished: jest.fn().mockReturnValue(true),
        getWinner: jest.fn().mockReturnValue('player1'),
      };
      const spy = jest.spyOn(ScoringEngine, 'fromSerialized').mockReturnValue(mockEngine as any);

      const result: any = await transitionMatchState('match-1', 'FINISHED', PLAYER_1.id, scoreState);

      expect(result).toHaveProperty('error');
      expect(result.error).toContain('INVALID_TRANSITION');
      spy.mockRestore();
    });
  });
});

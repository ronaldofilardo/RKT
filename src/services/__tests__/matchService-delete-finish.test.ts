jest.mock('@/lib/prisma', () => ({
  prisma: {
    match: {
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    pointLog: {
      deleteMany: jest.fn(),
    },
    matchAnnotationSession: {
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn((ops) => Promise.all(ops)),
  },
}));

import { prisma } from '@/lib/prisma';

const mockPrisma = prisma as any;

describe('deleteMatch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve retornar erro se partida não existe', async () => {
    const { deleteMatch } = await import('@/services/matchService');

    mockPrisma.match.findFirst.mockResolvedValue(null);

    const result = await deleteMatch('nonexistent', { type: 'soft' });

    expect(result).toEqual({ error: 'MATCH_NOT_FOUND' });
  });

  it('deve bloquear hard delete de partida FINISHED', async () => {
    const { deleteMatch } = await import('@/services/matchService');

    mockPrisma.match.findFirst.mockResolvedValue({
      id: 'm1',
      state: 'FINISHED',
      pointLog: [],
      annotationSessions: [],
    });

    const result = await deleteMatch('m1', { type: 'hard' });

    expect(result).toEqual({
      error: 'CANNOT_DELETE_FINISHED: Partidas finalizadas não podem ser excluídas permanentemente',
    });
  });

  it('deve permitir hard delete de partida com pontos', async () => {
    const { deleteMatch } = await import('@/services/matchService');

    mockPrisma.match.findFirst.mockResolvedValue({
      id: 'm1',
      state: 'IN_PROGRESS',
      pointLog: [{ id: 'p1' }, { id: 'p2' }],
      annotationSessions: [],
    });

    mockPrisma.match.delete.mockResolvedValue({ id: 'm1' });

    const result = await deleteMatch('m1', { type: 'hard' });

    expect(result).toEqual({ success: true, type: 'hard' });
    expect(mockPrisma.match.delete).toHaveBeenCalledWith({ where: { id: 'm1' } });
  });

  it('deve realizar hard delete com sucesso', async () => {
    const { deleteMatch } = await import('@/services/matchService');

    mockPrisma.match.findFirst.mockResolvedValue({
      id: 'm1',
      state: 'SCHEDULED',
      pointLog: [],
      annotationSessions: [],
    });

    mockPrisma.match.delete.mockResolvedValue({ id: 'm1' });

    const result = await deleteMatch('m1', { type: 'hard' });

    expect(result).toEqual({ success: true, type: 'hard' });
    expect(mockPrisma.match.delete).toHaveBeenCalledWith({ where: { id: 'm1' } });
  });

  it('deve realizar soft delete marcando como CANCELLED', async () => {
    const { deleteMatch } = await import('@/services/matchService');

    mockPrisma.match.findFirst.mockResolvedValue({
      id: 'm1',
      state: 'SCHEDULED',
      pointLog: [],
      annotationSessions: [],
    });

    mockPrisma.match.update.mockResolvedValue({ id: 'm1', state: 'CANCELLED' });

    const result = await deleteMatch('m1', { type: 'soft' });

    expect(result).toEqual({
      success: true,
      type: 'soft',
      stats: { points: 0, annotationSessions: 0 },
    });
    expect(mockPrisma.match.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          state: 'CANCELLED',
          deletedAt: expect.any(Date),
        }),
      }),
    );
  });

  it('deve salvar motivo e deletedBy no soft delete', async () => {
    const { deleteMatch } = await import('@/services/matchService');

    mockPrisma.match.findFirst.mockResolvedValue({
      id: 'm1',
      state: 'IN_PROGRESS',
      pointLog: [],
      annotationSessions: [],
    });

    mockPrisma.match.update.mockResolvedValue({ id: 'm1' });

    await deleteMatch('m1', {
      type: 'soft',
      reason: 'Partida cancelada pelo organizador',
      deletedBy: 'user123',
    });

    expect(mockPrisma.match.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          state: 'CANCELLED',
          deletedAt: expect.any(Date),
          deletedBy: 'user123',
          finishNote: 'Partida cancelada pelo organizador',
        }),
      }),
    );
  });
});

describe('finishMatch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve retornar erro se partida não existe', async () => {
    const { finishMatch } = await import('@/services/matchService');

    mockPrisma.match.findFirst.mockResolvedValue(null);

    const result = await finishMatch('nonexistent', {});

    expect(result).toEqual({ error: 'MATCH_NOT_FOUND' });
  });

  it('deve retornar erro se partida já está FINISHED', async () => {
    const { finishMatch } = await import('@/services/matchService');

    mockPrisma.match.findFirst.mockResolvedValue({
      id: 'm1',
      state: 'FINISHED',
    });

    const result = await finishMatch('m1', {});

    expect(result).toEqual({ error: 'ALREADY_FINISHED: Partida já está finalizada' });
  });

  it('deve retornar erro se partida está CANCELLED', async () => {
    const { finishMatch } = await import('@/services/matchService');

    mockPrisma.match.findFirst.mockResolvedValue({
      id: 'm1',
      state: 'CANCELLED',
    });

    const result = await finishMatch('m1', {});

    expect(result).toEqual({ error: 'CANNOT_FINISH_CANCELLED: Partida cancelada não pode ser finalizada' });
  });

  it('deve finalizar partida COMPLETED sem scoreState com erro', async () => {
    const { finishMatch } = await import('@/services/matchService');

    mockPrisma.match.findFirst.mockResolvedValue({
      id: 'm1',
      state: 'IN_PROGRESS',
      format: 'BEST_OF_3',
      player1Id: 'p1',
      player2Id: 'p2',
      initialServerId: 'p1',
    });

    const result = await finishMatch('m1', null, { reason: 'COMPLETED' });

    expect(result).toEqual({
      error: 'CANNOT_FINISH: Partida sem pontuação registrada',
    });
  });

  it('deve finalizar partida com reason ABANDONED sem validar scoreState', async () => {
    const { finishMatch } = await import('@/services/matchService');

    mockPrisma.match.findFirst.mockResolvedValue({
      id: 'm1',
      state: 'IN_PROGRESS',
      format: 'BEST_OF_3',
      player1Id: 'p1',
      player2Id: 'p2',
      initialServerId: 'p1',
    });

    mockPrisma.match.update.mockResolvedValue({ id: 'm1', state: 'FINISHED' });

    const result = await finishMatch('m1', null, { reason: 'ABANDONED' });

    expect(result).toBeTruthy();
    expect(mockPrisma.match.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          state: 'FINISHED',
          finishedAt: expect.any(Date),
          finishReason: 'ABANDONED',
        }),
      }),
    );
  });

  it('deve finalizar partida COMPLETED com scoreState válido', async () => {
    const { finishMatch } = await import('@/services/matchService');
    const { ScoringEngine } = await import('@/core/scoring/engine');

    const mockEngine = {
      isFinished: jest.fn().mockReturnValue(true),
    };
    jest.spyOn(ScoringEngine, 'fromSerialized').mockReturnValue(mockEngine as any);

    mockPrisma.match.findFirst.mockResolvedValue({
      id: 'm1',
      state: 'IN_PROGRESS',
      format: 'BEST_OF_3',
      player1Id: 'p1',
      player2Id: 'p2',
      initialServerId: 'p1',
    });

    mockPrisma.match.update.mockResolvedValue({ id: 'm1', state: 'FINISHED' });

    const scoreState = { sets: [{ player1: 6, player2: 4 }], isFinished: true };

    const result = await finishMatch('m1', scoreState, { reason: 'COMPLETED' });

    expect(result).toBeTruthy();
    expect(mockPrisma.match.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          state: 'FINISHED',
          finishedAt: expect.any(Date),
          finishReason: 'COMPLETED',
          scoreState,
        }),
      }),
    );
  });

  it('deve salvar nota opcional ao finalizar', async () => {
    const { finishMatch } = await import('@/services/matchService');
    const { ScoringEngine } = await import('@/core/scoring/engine');

    const mockEngine = {
      isFinished: jest.fn().mockReturnValue(true),
    };
    jest.spyOn(ScoringEngine, 'fromSerialized').mockReturnValue(mockEngine as any);

    mockPrisma.match.findFirst.mockResolvedValue({
      id: 'm1',
      state: 'IN_PROGRESS',
      format: 'BEST_OF_3',
      player1Id: 'p1',
      player2Id: 'p2',
      initialServerId: 'p1',
    });

    mockPrisma.match.update.mockResolvedValue({ id: 'm1' });

    await finishMatch('m1', { sets: [], isFinished: true }, {
      reason: 'COMPLETED',
      note: 'Motivo pessoal do encerramento',
    });

    expect(mockPrisma.match.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          finishNote: 'Motivo pessoal do encerramento',
        }),
      }),
    );
  });

  it('deve salvar winnerId ao finalizar', async () => {
    const { finishMatch } = await import('@/services/matchService');
    const { ScoringEngine } = await import('@/core/scoring/engine');

    const mockEngine = {
      isFinished: jest.fn().mockReturnValue(true),
    };
    jest.spyOn(ScoringEngine, 'fromSerialized').mockReturnValue(mockEngine as any);

    mockPrisma.match.findFirst.mockResolvedValue({
      id: 'm1',
      state: 'IN_PROGRESS',
      format: 'BEST_OF_3',
      player1Id: 'p1',
      player2Id: 'p2',
      initialServerId: 'p1',
    });

    mockPrisma.match.update.mockResolvedValue({ id: 'm1' });

    await finishMatch('m1', { sets: [], isFinished: true }, {
      reason: 'COMPLETED',
      winnerId: 'p1',
    });

    expect(mockPrisma.match.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          winnerId: 'p1',
        }),
      }),
    );
  });
});
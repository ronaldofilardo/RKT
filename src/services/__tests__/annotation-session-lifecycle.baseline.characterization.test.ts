/**
 * Baseline de Caracterização — Ciclo de Vida de Sessões de Anotação e Prevenção de Locks Órfãos
 * 
 * Verifica que cleanupStaleSessions desativa sessões inativas/órfãs
 * e preserva sessões recentes válidas.
 */

jest.mock('@/lib/prisma', () => ({
  prisma: {
    matchAnnotationSession: {
      updateMany: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';
import { cleanupStaleSessions } from '../sessionService';

const mockPrisma = prisma as any;

describe('Annotation Session Lifecycle & Stale Lock Prevention', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve desativar sessões com isActive=true anteriores ao corte de 4 horas', async () => {
    mockPrisma.matchAnnotationSession.updateMany.mockResolvedValue({ count: 3 });

    const beforeCall = Date.now();
    const result = await cleanupStaleSessions({ maxAgeHours: 4 });
    const afterCall = Date.now();

    expect(result.count).toBe(3);
    expect(mockPrisma.matchAnnotationSession.updateMany).toHaveBeenCalledTimes(1);

    const callArgs = mockPrisma.matchAnnotationSession.updateMany.mock.calls[0][0] as any;
    expect(callArgs.where.isActive).toBe(true);
    expect(callArgs.data.isActive).toBe(false);
    expect(callArgs.data.status).toBe('ABANDONED');

    const cutoff = callArgs.where.createdAt.lt.getTime();
    const expectedCutoffMin = beforeCall - 4 * 60 * 60 * 1000;
    const expectedCutoffMax = afterCall - 4 * 60 * 60 * 1000;

    expect(cutoff).toBeGreaterThanOrEqual(expectedCutoffMin);
    expect(cutoff).toBeLessThanOrEqual(expectedCutoffMax);
  });

  it('deve filtrar por matchId quando fornecido', async () => {
    mockPrisma.matchAnnotationSession.updateMany.mockResolvedValue({ count: 1 });

    const result = await cleanupStaleSessions({ matchId: 'match-especifica-123', maxAgeHours: 2 });
    expect(result.count).toBe(1);

    const callArgs = mockPrisma.matchAnnotationSession.updateMany.mock.calls[0][0] as any;
    expect(callArgs.where.matchId).toBe('match-especifica-123');
    expect(callArgs.where.isActive).toBe(true);
  });

  it('deve retornar count 0 sem erros se nenhuma sessão estiver órfã', async () => {
    mockPrisma.matchAnnotationSession.updateMany.mockResolvedValue({ count: 0 });

    const result = await cleanupStaleSessions();
    expect(result.count).toBe(0);
  });
});

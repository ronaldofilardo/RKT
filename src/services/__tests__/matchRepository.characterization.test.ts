/**
 * CONTRATO PÓS-FASE 4 — src/services/matchRepository.ts (listMatches)
 *
 * Valida o isolamento estrito de listagem por usuário criador:
 * - Sem createdByUserId → []
 * - Usuário comum (PARTICULAR ou CT) → OR restrito a createdByUserId + (cartazes próprios)
 * - followedPlayerIds → NÃO gera vazamento de anotações alheias
 * - Gestor (ctMemberUserIds) → vê CT + derivadas dos membros do CT + cartazes próprios
 * - assignedCoachId → inclui cartazes designados ainda sem anotação do treinador
 * - Cartazes (`isTemplate`) só entram quando criados pelo próprio usuário
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

const mockPrisma = {
  match: {
    findMany: jest.fn(),
  },
};

jest.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}));

describe('listMatches Context Segregation (pós-Fase 4)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna lista vazia sem chamar Prisma quando createdByUserId é omitido', async () => {
    const { listMatches } = await import('@/services/matchRepository');
    const result = await listMatches(null, null, 20, null);
    expect(result).toEqual([]);
    expect(mockPrisma.match.findMany).not.toHaveBeenCalled();
  });

  it('filtra por ctId null e createdByUserId no modo PARTICULAR', async () => {
    const { listMatches } = await import('@/services/matchRepository');
    mockPrisma.match.findMany.mockResolvedValue([]);

    await listMatches(null, null, 20, 'coach-1', 'PARTICULAR');

    expect(mockPrisma.match.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          deletedAt: null,
          OR: [
            { createdByUserId: 'coach-1', ctId: null, isPublicTemplate: false, isTemplate: false },
            { createdByUserId: 'coach-1', ctId: null, isTemplate: true },
          ],
        },
      }),
    );
  });

  it('filtra por ctId E createdByUserId no modo CT (sem vazamento entre treinadores)', async () => {
    const { listMatches } = await import('@/services/matchRepository');
    mockPrisma.match.findMany.mockResolvedValue([]);

    await listMatches(null, null, 20, 'coach-1', 'ct-rkt-123');

    expect(mockPrisma.match.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          deletedAt: null,
          OR: [
            { createdByUserId: 'coach-1', ctId: 'ct-rkt-123', isPublicTemplate: false, isTemplate: false },
            { createdByUserId: 'coach-1', ctId: 'ct-rkt-123', isTemplate: true },
          ],
        },
      }),
    );
  });

  it('não vaza anotações alheias para followedPlayerIds, trazendo apenas cartazes do círculo pendentes de anotação', async () => {
    const { listMatches } = await import('@/services/matchRepository');
    mockPrisma.match.findMany.mockResolvedValue([]);

    await listMatches(null, null, 20, 'coach-1', 'PARTICULAR', ['player-followed-1']);

    expect(mockPrisma.match.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          deletedAt: null,
          OR: [
            { createdByUserId: 'coach-1', ctId: null, isPublicTemplate: false, isTemplate: false },
            { createdByUserId: 'coach-1', ctId: null, isTemplate: true },
            {
              isTemplate: true,
              createdByUserId: { not: 'coach-1' },
              eventScope: { in: ['PUBLIC', 'PRIVATE_CLUB', 'PRIVATE_COACH', 'PRIVATE_PLAYERS'] },
              annotations: { none: { createdByUserId: 'coach-1', deletedAt: null, state: { not: 'CANCELLED' } } },
              OR: [
                { player1Id: { in: ['player-followed-1'] } },
                { player2Id: { in: ['player-followed-1'] } },
                { player1PartnerId: { in: ['player-followed-1'] } },
                { player2PartnerId: { in: ['player-followed-1'] } },
              ],
            },
          ],
        },
      }),
    );
  });

  it('gestor com ctMemberUserIds inclui derivadas dos membros do clube', async () => {
    const { listMatches } = await import('@/services/matchRepository');
    mockPrisma.match.findMany.mockResolvedValue([]);

    await listMatches(null, null, 20, 'gestor-1', null, null, {
      unrestricted: false,
      ctMemberUserIds: ['membro-a', 'membro-b'],
    });

    expect(mockPrisma.match.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          deletedAt: null,
          OR: [
            { createdByUserId: 'gestor-1', isPublicTemplate: false, isTemplate: false },
            {
              sourceMatchId: { not: null },
              createdByUserId: { in: ['membro-a', 'membro-b'] },
              isPublicTemplate: false,
              isTemplate: false,
            },
            { isTemplate: true, createdByUserId: 'gestor-1' },
          ],
        },
      }),
    );
  });

  it('assignedCoachId inclui cartazes designados ainda sem anotação própria', async () => {
    const { listMatches } = await import('@/services/matchRepository');
    mockPrisma.match.findMany.mockResolvedValue([]);

    await listMatches(null, null, 20, 'coach-1', null, null, null, 'coach-1');

    expect(mockPrisma.match.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          deletedAt: null,
          OR: [
            { createdByUserId: 'coach-1', isPublicTemplate: false, isTemplate: false },
            { isTemplate: true, createdByUserId: 'coach-1' },
            {
              assignedCoachId: 'coach-1',
              annotations: { none: { createdByUserId: 'coach-1', deletedAt: null, state: { not: 'CANCELLED' } } },
            },
          ],
        },
      }),
    );
  });

  it('cartaz de outro criador NUNCA entra no escopo do anotador', async () => {
    const { listMatches } = await import('@/services/matchRepository');
    mockPrisma.match.findMany.mockResolvedValue([]);

    await listMatches(null, null, 20, 'coach-1', 'ct-rkt-123');

    const where = mockPrisma.match.findMany.mock.calls[0][0].where;
    const templateConds = (where.OR as Array<Record<string, unknown>>).filter((c) => c.isTemplate === true);
    expect(templateConds).toHaveLength(1);
    expect(templateConds[0].createdByUserId).toBe('coach-1');
  });
});

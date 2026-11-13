/**
 * CONTRATO PÓS-FASE 5 — GET /api/gestor/matches
 *
 * Valida o painel do gestor agrupado por partida-mãe:
 * - Inclui cartazes e anotações do CT, de membros/atletas do CT e derivadas de PRIVATE_CLUB do CT.
 * - Retorna pointCount e isDesignatedAnnotator para diferenciar o treinador designado.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

const mockPrisma = {
  membership: { findMany: jest.fn() },
  playerCT: { findMany: jest.fn() },
  match: { findMany: jest.fn() },
};

jest.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}));

jest.mock('../../_logic', () => ({
  getGestorCtId: jest.fn(),
  denyGestor: jest.fn(() => ({ status: 403 })),
}));

jest.mock('@/lib/access-handler', () => ({
  withAccessHandler: jest.fn(async (_req, _action, _res, handler) => {
    return handler({
      user: { id: 'gestor-1', name: 'Gestor', role: 'GESTOR' },
      actor: { userId: 'gestor-1', isActive: true, canOperate: true, memberships: [] },
    });
  }),
}));

describe('GET /api/gestor/matches (pós-Fase 5)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('nega quando gestor não encontrado', async () => {
    const { getGestorCtId, denyGestor } = await import('../../_logic');
    (getGestorCtId as jest.Mock).mockResolvedValue(null);

    const { GET } = await import('../route');
    const request = { nextUrl: { searchParams: new URLSearchParams() } } as any;

    await GET(request);
    expect(denyGestor).toHaveBeenCalledWith('Gestor não encontrado');
  });

  it('query WHERE e cálculo de isDesignatedAnnotator + pointCount', async () => {
    const { getGestorCtId } = await import('../../_logic');
    (getGestorCtId as jest.Mock).mockResolvedValue('ct-gestor');

    mockPrisma.membership.findMany.mockResolvedValue([
      { userId: 'coach-1' },
      { userId: 'coach-2' },
    ]);
    mockPrisma.playerCT.findMany.mockResolvedValue([
      { playerId: 'player-1', player: { userId: 'athlete-1' } },
    ]);
    mockPrisma.match.findMany.mockResolvedValue([
      {
        id: 'ann-1',
        state: 'FINISHED',
        createdByUserId: 'coach-1',
        isOfficialClubAnnotation: false,
        sourceMatch: { id: 'tpl-1', assignedCoachId: 'coach-1' },
        _count: { pointLog: 42 },
      },
      {
        id: 'ann-2',
        state: 'IN_PROGRESS',
        createdByUserId: 'parent-1',
        isOfficialClubAnnotation: false,
        sourceMatch: { id: 'tpl-1', assignedCoachId: 'coach-1' },
        _count: { pointLog: 12 },
      },
    ]);

    const { GET } = await import('../route');
    const request = { nextUrl: { searchParams: new URLSearchParams() } } as any;

    const res = await GET(request);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.items[0].isDesignatedAnnotator).toBe(true);
    expect(json.items[0].pointCount).toBe(42);
    expect(json.items[1].isDesignatedAnnotator).toBe(false);
    expect(json.items[1].pointCount).toBe(12);
  });
});

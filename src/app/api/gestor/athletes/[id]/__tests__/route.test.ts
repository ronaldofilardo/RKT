import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';

const mockPrisma = {
  playerCT: { findFirst: jest.fn() },
  user: { update: jest.fn() },
  player: { update: jest.fn() },
  auditLog: { create: jest.fn() },
};

jest.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
jest.mock('@/lib/access-handler', () => ({
  withAccessHandler: (_req: any, _act: any, _res: any, handler: any) =>
    handler({ user: { id: 'u-gestor-1' } }),
}));
jest.mock('../../../_logic', () => ({
  getGestorCtId: jest.fn().mockResolvedValue('ct-1'),
  denyGestor: jest.fn(),
}));

describe('PATCH /api/gestor/athletes/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna 400 sem lançar SyntaxError quando o corpo da requisição for vazio', async () => {
    const { PATCH } = await import('../route');
    const req = new NextRequest('http://localhost:3000/api/gestor/athletes/p-1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: 'p-1' }) });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('VALIDATION_ERROR');
  });

  it('atualiza atleta com sucesso quando dados válidos são enviados', async () => {
    (mockPrisma.playerCT.findFirst as any).mockResolvedValue({
      id: 'pct-1',
      playerId: 'p-1',
      player: { id: 'p-1', userId: 'u-1', user: { id: 'u-1' } },
    });
    (mockPrisma.user.update as any).mockResolvedValue({});
    (mockPrisma.player.update as any).mockResolvedValue({});
    (mockPrisma.auditLog.create as any).mockResolvedValue({});

    const { PATCH } = await import('../route');
    const req = new NextRequest('http://localhost:3000/api/gestor/athletes/p-1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Atleta Editado',
        cpf: '12345678901',
        birthDate: '2005-01-01',
        gender: 'MASCULINO',
        dominance: 'DESTRO',
      }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: 'p-1' }) });
    expect(res.status).toBe(200);
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: 'u-1' },
      data: { name: 'Atleta Editado', cpf: '12345678901' },
    });
  });
});


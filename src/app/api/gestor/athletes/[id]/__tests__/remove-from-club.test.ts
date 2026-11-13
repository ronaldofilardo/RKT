import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';

const mockPrisma = {
  playerCT: { findFirst: jest.fn(), delete: jest.fn() },
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

function deleteReq() {
  return new NextRequest('http://localhost:3000/api/gestor/athletes/p-1', { method: 'DELETE' });
}

describe('DELETE /api/gestor/athletes/[id] — remover do elenco', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('remove só o vínculo com o clube, preservando cadastro e conta', async () => {
    (mockPrisma.playerCT.findFirst as any).mockResolvedValue({
      id: 'pct-1', playerId: 'p-1', player: { id: 'p-1', name: 'Juca Balas' },
    });
    (mockPrisma.playerCT.delete as any).mockResolvedValue({});
    (mockPrisma.auditLog.create as any).mockResolvedValue({});

    const { DELETE } = await import('../route');
    const res = await DELETE(deleteReq(), { params: Promise.resolve({ id: 'p-1' }) });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ removed: true, playerId: 'p-1' });
    expect(mockPrisma.playerCT.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ ctId: 'ct-1' }) }),
    );
    expect(mockPrisma.playerCT.delete).toHaveBeenCalledWith({ where: { id: 'pct-1' } });
    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          actorUserId: 'u-gestor-1',
          action: 'ATLETA_REMOVIDO_ELENCO',
          ctId: 'ct-1',
        }),
      }),
    );
  });

  it('retorna 404 quando o atleta não pertence ao elenco do clube', async () => {
    (mockPrisma.playerCT.findFirst as any).mockResolvedValue(null);

    const { DELETE } = await import('../route');
    const res = await DELETE(deleteReq(), { params: Promise.resolve({ id: 'p-x' }) });

    expect(res.status).toBe(404);
    expect((await res.json()).error).toBe('NOT_FOUND');
    expect(mockPrisma.playerCT.delete).not.toHaveBeenCalled();
  });
});

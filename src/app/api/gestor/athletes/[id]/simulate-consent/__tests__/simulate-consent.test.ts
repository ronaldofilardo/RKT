import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';

const mockPrisma = {
  playerCT: { findFirst: jest.fn() },
  guardianInvite: { findFirst: jest.fn(), update: jest.fn() },
  guardianLink: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
  consentRecord: { create: jest.fn() },
  user: { findUnique: jest.fn(), create: jest.fn() },
  player: { update: jest.fn() },
  auditLog: { create: jest.fn() },
  $transaction: jest.fn(async (cb: any) => cb(mockPrisma)),
};

jest.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
jest.mock('@/lib/access-handler', () => ({
  withAccessHandler: (_req: any, _act: any, _res: any, handler: any) =>
    handler({ user: { id: 'u-gestor-1' } }),
}));
jest.mock('../../../../_logic', () => ({
  getGestorCtId: jest.fn().mockResolvedValue('ct-1'),
  denyGestor: jest.fn(),
}));

function makeRequest() {
  return new NextRequest('http://localhost:3000/api/gestor/athletes/p-1/simulate-consent', {
    method: 'POST',
  });
}

describe('POST /api/gestor/athletes/[id]/simulate-consent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna 404 se o vínculo do atleta não for encontrado', async () => {
    (mockPrisma.playerCT.findFirst as any).mockResolvedValue(null);
    const { POST } = await import('../route');
    const res = await POST(makeRequest(), { params: Promise.resolve({ id: 'p-none' }) });
    expect(res.status).toBe(404);
  });

  it('simula o consentimento do responsável com sucesso', async () => {
    (mockPrisma.playerCT.findFirst as any).mockResolvedValue({
      id: 'pct-1',
      playerId: 'p-1',
      ctId: 'ct-1',
      player: { id: 'p-1', name: 'Atleta Menor' },
    });
    (mockPrisma.guardianInvite.findFirst as any).mockResolvedValue({
      id: 'gi-1',
      preGuardianName: 'Pai do Atleta',
      preGuardianCpf: '12345678901',
    });
    (mockPrisma.user.findUnique as any).mockResolvedValue({ id: 'u-guardian' });
    (mockPrisma.guardianLink.findFirst as any).mockResolvedValue(null);
    (mockPrisma.guardianLink.create as any).mockResolvedValue({});
    (mockPrisma.consentRecord.create as any).mockResolvedValue({});
    (mockPrisma.player.update as any).mockResolvedValue({});
    (mockPrisma.auditLog.create as any).mockResolvedValue({});

    const { POST } = await import('../route');
    const res = await POST(makeRequest(), { params: Promise.resolve({ id: 'p-1' }) });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.isConsented).toBe(true);
    expect(mockPrisma.player.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'p-1' },
        data: expect.objectContaining({ guardianGate: 'LIBERADO' }),
      }),
    );
  });
});

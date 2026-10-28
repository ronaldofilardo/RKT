jest.mock('@/lib/prisma', () => ({
  prisma: {
    player: { findUnique: jest.fn() },
    match: { updateMany: jest.fn() },
    playerCT: { updateMany: jest.fn() },
    auditLog: { create: jest.fn() },
    $transaction: jest.fn().mockImplementation(async (ops) => {
      const results = [];
      for (const op of ops) {
        results.push(await op);
      }
      return results;
    }),
  },
}));

jest.mock('@/lib/access-handler', () => ({
  withAccessHandler: (_request: any, _action: string, _resolveResource: any, handler: any) =>
    handler({ user: { id: 'u-admin', role: 'ADMIN' } as any, actor: { isActive: true, memberships: [] } as any }),
}));

jest.mock('@/services/player-merge.logic', () => ({
  mergePlayers: jest.fn(),
}));

import { NextRequest } from 'next/server';
import { POST } from '../route';
import { mergePlayers } from '@/services/player-merge.logic';

const mockMergePlayers = mergePlayers as jest.MockedFunction<typeof mergePlayers>;

describe('POST /api/players/merge', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMergePlayers.mockResolvedValue({
      sourceId: 'source-1',
      targetId: 'target-1',
      mergedIntoId: 'target-1',
    });
  });

  it('retorna 200 e realiza merge quando dados sao validos', async () => {
    const req = new NextRequest('http://localhost:3000/api/players/merge', {
      method: 'POST',
      body: JSON.stringify({ sourceId: 'source-1', targetId: 'target-1' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.message).toBe('Mesclagem realizada com sucesso.');
    expect(data.data).toEqual({ sourceId: 'source-1', targetId: 'target-1', mergedIntoId: 'target-1' });
    expect(mockMergePlayers).toHaveBeenCalledWith({
      sourceId: 'source-1',
      targetId: 'target-1',
      actorUserId: 'u-admin',
    });
  });

  it('retorna 400 quando body e invalido', async () => {
    const req = new NextRequest('http://localhost:3000/api/players/merge', {
      method: 'POST',
      body: JSON.stringify({ sourceId: '' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(mockMergePlayers).not.toHaveBeenCalled();
  });
});

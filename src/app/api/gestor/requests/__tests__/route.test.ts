import { NextRequest } from 'next/server';
import { GET } from '../route';
import { PUT } from '../[id]/route';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    playerCT: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
    $transaction: jest.fn((cb: any) => cb(prisma)),
  },
}));

jest.mock('../../_logic', () => ({
  getGestorCtId: jest.fn().mockResolvedValue('ct-1'),
  denyGestor: jest.fn((msg) => new Response(JSON.stringify({ error: msg }), { status: 403 })),
}));

jest.mock('@/lib/access-handler', () => ({
  withAccessHandler: jest.fn((_req, _perm, _resolver, handler) =>
    handler({ user: { id: 'gestor-user-1' } }),
  ),
}));

describe('GET /api/gestor/requests & PUT /api/gestor/requests/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET retorna lista formatada de solicitações pendentes e contagem', async () => {
    (prisma.playerCT.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'pct-1',
        playerId: 'p-1',
        since: new Date('2026-11-18T10:00:00Z'),
        player: {
          name: 'Menor Atleta',
          birthDate: new Date('2012-05-10T00:00:00Z'),
          age: 14,
          gender: 'MALE',
          guardianLinks: [{ relation: 'Pai', guardian: { name: 'Pai Legal', email: 'pai@local' } }],
          consentRecords: [{ purpose: 'DATA' }, { purpose: 'BROADCAST' }],
        },
      },
    ]);

    const req = new NextRequest('http://localhost:3000/api/gestor/requests');
    const res = await GET(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.count).toBe(1);
    expect(json.items[0].playerName).toBe('Menor Atleta');
    expect(json.items[0].guardianName).toBe('Pai Legal');
    expect(json.items[0].consents.DATA).toBe(true);
    expect(json.items[0].consents.BROADCAST).toBe(true);
    expect(json.items[0].consents.STATS).toBe(false);
  });

  it('PUT aceita solicitação promovendo para ACTIVE', async () => {
    (prisma.playerCT.findFirst as jest.Mock).mockResolvedValue({ id: 'pct-1', playerId: 'p-1' });
    (prisma.playerCT.update as jest.Mock).mockResolvedValue({ id: 'pct-1', status: 'ACTIVE' });

    const req = new NextRequest('http://localhost:3000/api/gestor/requests/pct-1', {
      method: 'PUT',
      body: JSON.stringify({ decision: 'ACCEPT' }),
    });

    const res = await PUT(req, { params: Promise.resolve({ id: 'pct-1' }) });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe('ACTIVE');
    expect(prisma.playerCT.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'pct-1' }, data: expect.objectContaining({ status: 'ACTIVE' }) }),
    );
  });
});

jest.mock('@/lib/prisma', () => ({
  prisma: {
    athleteClaim: { findMany: jest.fn() },
  },
}));

jest.mock('@/lib/auth-credentials.logic', () => ({
  getAccessUserFromRequest: jest.fn(),
}));

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GET } from '../route';
import { getAccessUserFromRequest } from '@/lib/auth-credentials.logic';

const mockGetAccessUser = getAccessUserFromRequest as jest.MockedFunction<typeof getAccessUserFromRequest>;
const mockAthleteClaimFindMany = (prisma as any).athleteClaim.findMany as jest.MockedFunction<any>;

describe('GET /api/athlete-claims/me', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna 401 quando nao autenticado', async () => {
    mockGetAccessUser.mockResolvedValue(null);

    const req = new NextRequest('http://localhost:3000/api/athlete-claims/me');
    const res = await GET(req);

    expect(res.status).toBe(401);
    expect(mockAthleteClaimFindMany).not.toHaveBeenCalled();
  });

  it('retorna claims do usuario autenticado', async () => {
    mockGetAccessUser.mockResolvedValue({ id: 'u-atleta', role: 'ANNOTATOR' });
    mockAthleteClaimFindMany.mockResolvedValue([
      {
        id: 'claim-1',
        playerId: 'p-1',
        status: 'PENDING',
        decidedByUserId: null,
        createdAt: new Date('2026-10-27T10:00:00Z'),
        player: { id: 'p-1', name: 'Atleta Provisorio', cpfHash: 'hash', cpfLast2: '25', identityStatus: 'PROVISIONAL' },
      },
    ]);

    const req = new NextRequest('http://localhost:3000/api/athlete-claims/me');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.items).toHaveLength(1);
    expect(data.items[0]).toMatchObject({
      id: 'claim-1',
      playerId: 'p-1',
      status: 'PENDING',
      player: { name: 'Atleta Provisorio', identityStatus: 'PROVISIONAL' },
    });
    expect(mockAthleteClaimFindMany).toHaveBeenCalledWith({
      where: { userId: 'u-atleta' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        playerId: true,
        status: true,
        decidedByUserId: true,
        createdAt: true,
        player: { select: { id: true, name: true, cpfHash: true, cpfLast2: true, identityStatus: true } },
      },
    });
  });
});

import { NextRequest } from 'next/server';

const mockGetMatchAccess = jest.fn();
const mockPointFindFirst = jest.fn();
const mockPointUpdate = jest.fn();

jest.mock('@/services/match-access-service', () => ({
  getMatchAccess: (...args: unknown[]) => mockGetMatchAccess(...args),
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    pointLog: {
      findFirst: (...args: unknown[]) => mockPointFindFirst(...args),
      update: (...args: unknown[]) => mockPointUpdate(...args),
    },
  },
}));

jest.mock('@/lib/access-handler', () => ({
  withAccessHandler: jest.fn(async (req: NextRequest, _perm, _res, handler) => {
    const userId = req.headers.get('x-test-user') ?? 'user-b';
    return handler({
      user: { id: userId, role: 'ANNOTATOR' },
      actor: {
        userId,
        isActive: true,
        canOperate: true,
        memberships: [],
        athleteCtIds: [],
        guardianOfPlayerIds: [],
        followedPlayerIds: [],
      },
    });
  }),
}));

import { DELETE, PATCH } from '../point/[pointId]/route';

describe('DELETE/PATCH /api/matches/[id]/point/[pointId] (isolamento por dono)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('bloqueia (403) outro anotador tentando anular ou editar ponto de anotação alheia', async () => {
    mockGetMatchAccess.mockResolvedValue({
      createdByUserId: 'user-a',
      ctId: null,
      isTemplate: false,
      annotatorUserIds: [],
      participantPlayerIds: ['p1', 'p2'],
      participantCtIds: [],
    });

    const delReq = new NextRequest('http://localhost/api/matches/m-a/point/pt-1', {
      method: 'DELETE',
      headers: { 'x-test-user': 'user-b' },
    });
    const delRes = await DELETE(delReq, { params: Promise.resolve({ id: 'm-a', pointId: 'pt-1' }) });
    expect(delRes.status).toBe(403);
    expect(mockPointUpdate).not.toHaveBeenCalled();

    const patchReq = new NextRequest('http://localhost/api/matches/m-a/point/pt-1', {
      method: 'PATCH',
      headers: { 'x-test-user': 'user-b' },
      body: JSON.stringify({ annotations: {} }),
    });
    const patchRes = await PATCH(patchReq, { params: Promise.resolve({ id: 'm-a', pointId: 'pt-1' }) });
    expect(patchRes.status).toBe(403);
    expect(mockPointUpdate).not.toHaveBeenCalled();
  });

  it('permite ao anotador dono anular o próprio ponto', async () => {
    mockGetMatchAccess.mockResolvedValue({
      createdByUserId: 'user-a',
      ctId: null,
      isTemplate: false,
      annotatorUserIds: [],
      participantPlayerIds: ['p1', 'p2'],
      participantCtIds: [],
    });
    mockPointFindFirst.mockResolvedValue({ id: 'pt-1', matchId: 'm-a' });
    mockPointUpdate.mockResolvedValue({ id: 'pt-1', voidedAt: new Date() });

    const delReq = new NextRequest('http://localhost/api/matches/m-a/point/pt-1', {
      method: 'DELETE',
      headers: { 'x-test-user': 'user-a' },
    });
    const delRes = await DELETE(delReq, { params: Promise.resolve({ id: 'm-a', pointId: 'pt-1' }) });
    expect(delRes.status).toBe(200);
    expect(mockPointUpdate).toHaveBeenCalled();
  });
});


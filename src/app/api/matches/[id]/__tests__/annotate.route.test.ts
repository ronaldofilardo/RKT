import { NextRequest } from 'next/server';

const mockResolve = jest.fn();
const mockListAvailable = jest.fn();

jest.mock('@/services/match-resolve-annotation.logic', () => ({
  resolveOrCreateAnnotation: (...args: unknown[]) => mockResolve(...args),
}));

jest.mock('@/services/match-available.logic', () => ({
  listAvailableTemplates: (...args: unknown[]) => mockListAvailable(...args),
}));

jest.mock('@/lib/access-handler', () => ({
  withAccessHandler: jest.fn(async (_req, _perm, _res, handler) =>
    handler({
      user: { id: 'u-1', role: 'ANNOTATOR', contextId: null },
      actor: { userId: 'u-1', isActive: true, canOperate: true, memberships: [], athleteCtIds: [], guardianOfPlayerIds: [], followedPlayerIds: [] },
    }),
  ),
}));

import { POST } from '../annotate/route';
import { GET } from '../../available/route';

describe('POST /api/matches/[id]/annotate e GET /api/matches/available', () => {
  beforeEach(() => jest.clearAllMocks());

  it('POST /api/matches/[id]/annotate retorna 201 quando cria anotação nova', async () => {
    mockResolve.mockResolvedValue({ matchId: 'ann-1', created: true, state: 'SCHEDULED' });
    const req = new NextRequest('http://localhost/api/matches/tpl-1/annotate', {
      method: 'POST',
      body: JSON.stringify({ mode: 'resolve' }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: 'tpl-1' }) });
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json).toEqual({ matchId: 'ann-1', created: true, state: 'SCHEDULED' });
  });

  it('POST /api/matches/[id]/annotate retorna 200 quando já existe anotação', async () => {
    mockResolve.mockResolvedValue({ matchId: 'ann-1', created: false, state: 'IN_PROGRESS' });
    const req = new NextRequest('http://localhost/api/matches/tpl-1/annotate', { method: 'POST' });

    const res = await POST(req, { params: Promise.resolve({ id: 'tpl-1' }) });
    expect(res.status).toBe(200);
  });

  it('GET /api/matches/available lista cartazes do círculo do usuário', async () => {
    mockListAvailable.mockResolvedValue([{ id: 'tpl-priv-1', myAnnotationId: null }]);
    const req = new NextRequest('http://localhost/api/matches/available?scope=private');

    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.matches).toHaveLength(1);
    expect(mockListAvailable).toHaveBeenCalledWith(expect.objectContaining({ userId: 'u-1' }), { scope: 'private', limit: 30 });
  });
});


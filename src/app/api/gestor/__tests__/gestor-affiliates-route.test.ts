import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';

const mockGetGestorCtId = jest.fn();
const mockFetchAffiliates = jest.fn();

jest.mock('../_logic', () => ({
  getGestorCtId: (...args: any[]) => mockGetGestorCtId(...args),
  denyGestor: jest.fn().mockReturnValue(new Response(JSON.stringify({ error: 'DENIED' }), { status: 403 })),
}));

jest.mock('@/lib/access-handler', () => ({
  withAccessHandler: jest.fn((req, perm, ctx, handler: any) =>
    handler({ user: { id: 'u-gestor', role: 'ANNOTATOR' } }),
  ),
}));

jest.mock('../affiliates/gestor-affiliates.logic', () => ({
  fetchAffiliateAthletes: (...args: any[]) => mockFetchAffiliates(...args),
}));

describe('GET /api/gestor/affiliates', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna 403 se não encontrar CT do gestor', async () => {
    mockGetGestorCtId.mockResolvedValue(null);
    const { GET } = await import('../affiliates/route');
    const req = new NextRequest('http://localhost:3000/api/gestor/affiliates');
    const res = await GET(req);
    expect(res.status).toBe(403);
  });

  it('retorna lista de afiliados quando autorizado', async () => {
    mockGetGestorCtId.mockResolvedValue('ct-123');
    mockFetchAffiliates.mockResolvedValue([
      { id: 'p-1', name: 'Atleta Um', nickname: 'a1', clubName: 'CT Morumbi' },
    ]);

    const { GET } = await import('../affiliates/route');
    const req = new NextRequest('http://localhost:3000/api/gestor/affiliates?q=um');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.items).toHaveLength(1);
    expect(mockFetchAffiliates).toHaveBeenCalledWith('um');
  });
});

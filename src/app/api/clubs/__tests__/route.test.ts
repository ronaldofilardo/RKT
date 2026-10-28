import { NextRequest } from 'next/server';

const mockClub = {
  findMany: jest.fn(),
  create: jest.fn(),
};

jest.mock('@/lib/prisma', () => ({
  prisma: { club: mockClub },
}));

jest.mock('@/lib/access-handler', () => ({
  withAccessHandler: (
    _request: any,
    _action: string,
    _resolveResource: any,
    handler: any,
  ) => handler({ user: { id: 'u-admin', role: 'ADMIN' } as any, actor: { id: 'u-admin', role: 'ADMIN', isActive: true, canOperate: true, memberships: [], athleteProfile: null, guardianLinks: [], coachAthleteLinks: [] } as any }),
}));

describe('POST /api/clubs — Fase 6 (vínculo Clube ↔ TrainingCenter via ctId)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('cria clube sem ctId (clube independente/venue)', async () => {
    mockClub.create.mockResolvedValue({ id: 'c-1', name: 'Clube A', city: 'São Paulo', ctId: null });

    const { POST } = await import('../route');
    const req = new NextRequest('http://localhost:3000/api/clubs', {
      method: 'POST',
      body: JSON.stringify({ name: 'Clube A', city: 'São Paulo' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.ctId).toBeNull();
    expect(mockClub.create).toHaveBeenCalledWith({
      data: { name: 'Clube A', city: 'São Paulo', ctId: null },
    });
  });

  it('cria clube vinculado a um TrainingCenter (ctId preenchido)', async () => {
    const ctId = 'ctabc123def456';
    mockClub.create.mockResolvedValue({ id: 'c-2', name: 'Clube B', city: 'Rio', ctId });

    const { POST } = await import('../route');
    const req = new NextRequest('http://localhost:3000/api/clubs', {
      method: 'POST',
      body: JSON.stringify({ name: 'Clube B', city: 'Rio', ctId }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.ctId).toBe(ctId);
    expect(mockClub.create).toHaveBeenCalledWith({
      data: { name: 'Clube B', city: 'Rio', ctId },
    });
  });

  it('rejeita ctId inválido (não é CUID)', async () => {
    const { POST } = await import('../route');
    const req = new NextRequest('http://localhost:3000/api/clubs', {
      method: 'POST',
      body: JSON.stringify({ name: 'Clube C', ctId: 'nao-e-um-cuid' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(mockClub.create).not.toHaveBeenCalled();
  });

  it('GET devolve clubes com ctId', async () => {
    mockClub.findMany.mockResolvedValue([
      { id: 'c-1', name: 'Clube A', city: 'São Paulo', ctId: 'ct-1' },
      { id: 'c-2', name: 'Clube B', city: 'Rio', ctId: null },
    ]);

    const { GET } = await import('../route');
    const req = new NextRequest('http://localhost:3000/api/clubs');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.items).toHaveLength(2);
    expect(data.items[0].ctId).toBe('ct-1');
    expect(data.items[1].ctId).toBeNull();
  });
});

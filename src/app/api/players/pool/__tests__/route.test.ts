jest.mock('@/lib/prisma', () => ({
  prisma: {
    player: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock('@/services/accessService', () => ({
  getActor: jest.fn(),
}));

jest.mock('@/services/player-service-pool.logic', () => ({
  listPoolPlayers: jest.fn(),
}));

import { NextRequest } from 'next/server';
import { listPoolPlayers } from '@/services/player-service-pool.logic';
import { getActor } from '@/services/accessService';
import { makeAuthHeaders } from '@/test-helpers/auth';

const mockListPoolPlayers = listPoolPlayers as jest.MockedFunction<typeof listPoolPlayers>;
const mockGetActor = getActor as jest.MockedFunction<typeof getActor>;

let ANNOTATOR_HEADERS: Record<string, string>;

beforeAll(async () => {
  ANNOTATOR_HEADERS = await makeAuthHeaders('user-123', 'ANNOTATOR');
});

const baseRow = (overrides: Record<string, unknown> = {}) => ({
  id: 'p-1',
  name: 'Joao Silva',
  birthDate: new Date('1990-01-01T00:00:00Z'),
  athleteCode: 'ABC12345',
  club: 'Clube A',
  ...overrides,
});

const actor = (overrides: Record<string, unknown> = {}) => ({
  userId: 'user-123',
  isActive: true,
  canOperate: true,
  memberships: [],
  athletePlayerId: null,
  athleteCtIds: [],
  guardianOfPlayerIds: [],
  followedPlayerIds: [],
  ...overrides,
});

describe('GET /api/players/pool', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve retornar 401 sem autenticacao', async () => {
    const req = new NextRequest('http://localhost:3000/api/players/pool');
    const mod = await import('@/app/api/players/pool/route');
    const res = await mod.GET(req);
    expect(res.status).toBe(401);
  });

  it('deve retornar view minima sem dados sensiveis (adulto)', async () => {
    mockGetActor.mockResolvedValue(actor({ memberships: [] }));
    mockListPoolPlayers.mockResolvedValue([baseRow()]);

    const req = new NextRequest(
      'http://localhost:3000/api/players/pool?myClub=false',
      { headers: ANNOTATOR_HEADERS },
    );
    const mod = await import('@/app/api/players/pool/route');
    const res = await mod.GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.data.players).toEqual([
      { id: 'p-1', name: 'Joao Silva', athleteCode: 'ABC12345', club: 'Clube A', minor: false },
    ]);
    expect(data.data.nextCursor).toBeNull();
    expect(mockListPoolPlayers).toHaveBeenCalledWith({
      cursor: undefined,
      limit: 20,
      q: undefined,
      ctIds: null,
    });
  });

  it('deve mascarar menores de idade (nome mascarado, sem clube/codigo)', async () => {
    mockGetActor.mockResolvedValue(actor({ memberships: [] }));
    mockListPoolPlayers.mockResolvedValue([
      baseRow({ name: 'Maria Menor', birthDate: new Date('2015-01-01T00:00:00Z') }),
    ]);

    const req = new NextRequest(
      'http://localhost:3000/api/players/pool?myClub=false',
      { headers: ANNOTATOR_HEADERS },
    );
    const mod = await import('@/app/api/players/pool/route');
    const res = await mod.GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.data.players).toEqual([
      {
        id: 'p-1',
        name: 'M***',
        athleteCode: null,
        club: null,
        minor: true,
      },
    ]);
  });

  it('com meu clube=true escopo restrito aos CTs do ator', async () => {
    mockGetActor.mockResolvedValue(
      actor({ memberships: [{ kind: 'GESTOR', ctId: 'ct-1', status: 'ACTIVE' }] }),
    );
    mockListPoolPlayers.mockResolvedValue([]);

    const req = new NextRequest(
      'http://localhost:3000/api/players/pool?myClub=true',
      { headers: ANNOTATOR_HEADERS },
    );
    const mod = await import('@/app/api/players/pool/route');
    await mod.GET(req);

    expect(mockListPoolPlayers).toHaveBeenCalledWith({
      cursor: undefined,
      limit: 20,
      q: undefined,
      ctIds: ['ct-1'],
    });
  });

  it('com meu clube=true e sem CTs cai para pool global (ANY)', async () => {
    mockGetActor.mockResolvedValue(actor({ memberships: [] }));
    mockListPoolPlayers.mockResolvedValue([]);

    const req = new NextRequest(
      'http://localhost:3000/api/players/pool?myClub=true',
      { headers: ANNOTATOR_HEADERS },
    );
    const mod = await import('@/app/api/players/pool/route');
    await mod.GET(req);

    expect(mockListPoolPlayers).toHaveBeenCalledWith({
      cursor: undefined,
      limit: 20,
      q: undefined,
      ctIds: null,
    });
  });

  it('aplica busca por nome q', async () => {
    mockGetActor.mockResolvedValue(actor({ memberships: [] }));
    mockListPoolPlayers.mockResolvedValue([]);

    const req = new NextRequest(
      'http://localhost:3000/api/players/pool?q=Joao&myClub=false',
      { headers: ANNOTATOR_HEADERS },
    );
    const mod = await import('@/app/api/players/pool/route');
    await mod.GET(req);

    expect(mockListPoolPlayers).toHaveBeenCalledWith({
      cursor: undefined,
      limit: 20,
      q: 'Joao',
      ctIds: null,
    });
  });

  it('suporta paginacao por cursor e limite', async () => {
    mockGetActor.mockResolvedValue(actor({ memberships: [] }));
    mockListPoolPlayers.mockResolvedValue([]);

    const req = new NextRequest(
      'http://localhost:3000/api/players/pool?cursor=p-1&limit=50',
      { headers: ANNOTATOR_HEADERS },
    );
    const mod = await import('@/app/api/players/pool/route');
    await mod.GET(req);

    expect(mockListPoolPlayers).toHaveBeenCalledWith({
      cursor: 'p-1',
      limit: 50,
      q: undefined,
      ctIds: null,
    });
  });

  it('deve retornar 403 quando a conta nao esta ativa', async () => {
    mockGetActor.mockResolvedValue({ ...actor(), isActive: false });
    mockListPoolPlayers.mockResolvedValue([]);

    const req = new NextRequest(
      'http://localhost:3000/api/players/pool?myClub=false',
      { headers: ANNOTATOR_HEADERS },
    );
    const mod = await import('@/app/api/players/pool/route');
    const res = await mod.GET(req);

    expect(res.status).toBe(403);
    expect(mockListPoolPlayers).not.toHaveBeenCalled();
  });
});

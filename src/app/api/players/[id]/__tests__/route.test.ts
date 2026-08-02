import { NextRequest } from 'next/server';

jest.mock('@/services/playerService', () => ({
  getPlayerById: jest.fn(),
  updatePlayer: jest.fn(),
}));

import { GET, PUT } from '@/app/api/players/[id]/route';
import { getPlayerById, updatePlayer } from '@/services/playerService';
import { makeAuthHeadersSync } from '@/test-helpers/auth';

const mockGetPlayer = getPlayerById as jest.MockedFunction<typeof getPlayerById>;
const mockUpdatePlayer = updatePlayer as jest.MockedFunction<typeof updatePlayer>;

const PLAYER_ID = 'player-123';

const ATHLETE = makeAuthHeadersSync('user-1', 'ATHLETE');
const SPECTATOR = makeAuthHeadersSync('user-2', 'SPECTATOR');

function getReq(headers: Record<string, string> = {}) {
  return new NextRequest(`http://localhost:3000/api/players/${PLAYER_ID}`, {
    method: 'GET',
    headers: { ...SPECTATOR, ...headers },
  });
}

function putReq(body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest(`http://localhost:3000/api/players/${PLAYER_ID}`, {
    method: 'PUT',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json', ...ATHLETE, ...headers },
  });
}

describe('GET /api/players/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve retornar 200 com dados do atleta', async () => {
    mockGetPlayer.mockResolvedValue({ id: PLAYER_ID, name: 'João' } as any);

    const res = await GET(getReq(), {
      params: Promise.resolve({ id: PLAYER_ID }),
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.id).toBe(PLAYER_ID);
    expect(mockGetPlayer).toHaveBeenCalledWith(PLAYER_ID);
  });

  it('deve retornar 404 quando atleta não existe', async () => {
    mockGetPlayer.mockResolvedValue(null);

    const res = await GET(getReq(), {
      params: Promise.resolve({ id: 'missing' }),
    });
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe('NOT_FOUND');
  });

  it('deve retornar 500 em erro inesperado', async () => {
    mockGetPlayer.mockRejectedValue(new Error('boom'));

    const res = await GET(getReq(), {
      params: Promise.resolve({ id: PLAYER_ID }),
    });

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('INTERNAL_ERROR');
  });
});

describe('PUT /api/players/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPlayer.mockResolvedValue({ id: PLAYER_ID, name: 'João' } as any);
    mockUpdatePlayer.mockImplementation(async (_id, data) => ({ id: PLAYER_ID, ...data } as any));
  });

  it('deve atualizar nome válido', async () => {
    const res = await PUT(putReq({ name: 'João Silva' }), {
      params: Promise.resolve({ id: PLAYER_ID }),
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.name).toBe('João Silva');
    expect(mockUpdatePlayer).toHaveBeenCalledWith(
      PLAYER_ID,
      expect.objectContaining({ name: 'João Silva' }),
    );
  });

  it('deve retornar 400 com nome curto', async () => {
    const res = await PUT(putReq({ name: 'A' }), {
      params: Promise.resolve({ id: PLAYER_ID }),
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('VALIDATION_ERROR');
    expect(mockUpdatePlayer).not.toHaveBeenCalled();
  });

  it('deve retornar 400 com nome não-string', async () => {
    const res = await PUT(putReq({ name: 123 }), {
      params: Promise.resolve({ id: PLAYER_ID }),
    });

    expect(res.status).toBe(400);
  });

  it('deve retornar 400 com gender inválido', async () => {
    const res = await PUT(putReq({ gender: 'OTHER' }), {
      params: Promise.resolve({ id: PLAYER_ID }),
    });

    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('VALIDATION_ERROR');
  });

  it('deve aceitar gender null sem validar enum', async () => {
    const res = await PUT(putReq({ gender: null }), {
      params: Promise.resolve({ id: PLAYER_ID }),
    });

    expect(res.status).toBe(200);
  });

  it('deve retornar 400 com dominance inválida', async () => {
    const res = await PUT(putReq({ dominance: 'CENTER' }), {
      params: Promise.resolve({ id: PLAYER_ID }),
    });

    expect(res.status).toBe(400);
  });

  it('deve retornar 400 com backhand inválido', async () => {
    const res = await PUT(putReq({ backhand: 'THREE_HANDED' }), {
      params: Promise.resolve({ id: PLAYER_ID }),
    });

    expect(res.status).toBe(400);
  });

  it('deve calcular idade a partir de birthDate', async () => {
    const currentYear = new Date().getFullYear();
    const res = await PUT(putReq({ birthDate: `${currentYear - 25}-06-15` }), {
      params: Promise.resolve({ id: PLAYER_ID }),
    });

    expect(res.status).toBe(200);
    const callArgs = mockUpdatePlayer.mock.calls[0][1] as Record<string, unknown>;
    expect(typeof callArgs.age).toBe('number');
    expect(callArgs.age).toBeGreaterThanOrEqual(24);
    expect(callArgs.age).toBeLessThanOrEqual(26);
    expect(callArgs.birthDate).toBeInstanceOf(Date);
  });

  it('deve aceitar birthDate null sem calcular idade', async () => {
    const res = await PUT(putReq({ birthDate: null }), {
      params: Promise.resolve({ id: PLAYER_ID }),
    });

    expect(res.status).toBe(200);
    const callArgs = mockUpdatePlayer.mock.calls[0][1] as Record<string, unknown>;
    expect(callArgs.age).toBeUndefined();
    expect(callArgs.birthDate).toBeUndefined();
  });

  it('deve retornar 400 com birthDate inválida', async () => {
    const res = await PUT(putReq({ birthDate: 'not-a-date' }), {
      params: Promise.resolve({ id: PLAYER_ID }),
    });

    expect(res.status).toBe(400);
    expect((await res.json()).message).toMatch(/inválida/);
  });

  it('deve retornar 400 com rankings sendo array', async () => {
    const res = await PUT(putReq({ rankings: [] }), {
      params: Promise.resolve({ id: PLAYER_ID }),
    });

    expect(res.status).toBe(400);
  });

  it('deve retornar 400 com ranking type inválido', async () => {
    const res = await PUT(putReq({ rankings: { INVALID: { position: 1 } } }), {
      params: Promise.resolve({ id: PLAYER_ID }),
    });

    expect(res.status).toBe(400);
  });

  it('deve retornar 400 com position <= 0', async () => {
    const res = await PUT(putReq({ rankings: { CBT: { position: 0 } } }), {
      params: Promise.resolve({ id: PLAYER_ID }),
    });

    expect(res.status).toBe(400);
  });

  it('deve retornar 400 com ranking que não é objeto', async () => {
    const res = await PUT(putReq({ rankings: { CBT: 'top' } }), {
      params: Promise.resolve({ id: PLAYER_ID }),
    });

    expect(res.status).toBe(400);
  });

  it('deve retornar 404 quando atleta não existe', async () => {
    mockGetPlayer.mockResolvedValue(null);
    const res = await PUT(putReq({ name: 'João' }), {
      params: Promise.resolve({ id: 'missing' }),
    });

    expect(res.status).toBe(404);
  });

  it('deve retornar 500 em erro inesperado', async () => {
    mockUpdatePlayer.mockRejectedValue(new Error('db down'));

    const res = await PUT(putReq({ name: 'João' }), {
      params: Promise.resolve({ id: PLAYER_ID }),
    });

    expect(res.status).toBe(500);
  });

  it('deve chamar com headers de auth (não bloqueia, mas exercita o path)', async () => {
    const headers = makeAuthHeadersSync('user-1', 'ATHLETE');
    const res = await PUT(putReq({ name: 'João' }, headers), {
      params: Promise.resolve({ id: PLAYER_ID }),
    });
    expect(res.status).toBe(200);
  });
});

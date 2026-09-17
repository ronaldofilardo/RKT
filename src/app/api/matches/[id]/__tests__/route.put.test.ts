jest.mock('@/lib/auth', () => ({
  withRLSHandler: jest.fn(async (_req: any, _role: string, handler: Function) => handler()),
  getRLSUser: jest.fn(),
}));

jest.mock('@/services/matchService', () => ({
  updateMatch: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logger: { error: jest.fn(), info: jest.fn(), warn: jest.fn() },
}));

import { NextRequest } from 'next/server';
import { handlePutMatch } from '@/app/api/matches/[id]/route.put';
import { updateMatch } from '@/services/matchService';
import { getRLSUser } from '@/lib/auth';
import { makeAuthHeaders } from '@/test-helpers/auth';

const mockUpdateMatch = updateMatch as jest.MockedFunction<typeof updateMatch>;
const mockGetRLSUser = getRLSUser as jest.MockedFunction<typeof getRLSUser>;

let ANNOTATOR_HEADERS: Record<string, string> = {};

beforeAll(async () => {
  ANNOTATOR_HEADERS = await makeAuthHeaders('user-1', 'ANNOTATOR');
});

function putReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/matches/match-1', {
    method: 'PUT',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json', ...ANNOTATOR_HEADERS },
  });
}

describe('PUT /api/matches/[id] (route.put)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetRLSUser.mockReturnValue({ id: 'user-1', role: 'ANNOTATOR' } as any);
  });

  it('deve retornar 404 quando updateMatch retorna null', async () => {
    mockUpdateMatch.mockResolvedValue(null as any);

    const res = await handlePutMatch(putReq({ nickname: 'new name' }), {
      params: Promise.resolve({ id: 'nonexistent' }),
    });
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toBe('MATCH_NOT_FOUND');
  });

  it('deve atualizar partida com sucesso', async () => {
    const updatedMatch = { id: 'match-1', nickname: 'new name', version: 1 };
    mockUpdateMatch.mockResolvedValue(updatedMatch as any);

    const res = await handlePutMatch(putReq({ nickname: 'new name' }), {
      params: Promise.resolve({ id: 'match-1' }),
    });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.id).toBe('match-1');
    expect(data.nickname).toBe('new name');
  });

  it('deve repassar body completo para updateMatch', async () => {
    mockUpdateMatch.mockResolvedValue({ id: 'match-1' } as any);

    await handlePutMatch(putReq({ nickname: 'updated', visibility: 'PUBLIC' }), {
      params: Promise.resolve({ id: 'match-1' }),
    });

    expect(mockUpdateMatch).toHaveBeenCalledWith('match-1', {
      nickname: 'updated',
      visibility: 'PUBLIC',
    });
  });

  it('deve retornar 500 quando updateMatch lança exceção', async () => {
    mockUpdateMatch.mockRejectedValue(new Error('DB error'));

    const res = await handlePutMatch(putReq({ nickname: 'x' }), {
      params: Promise.resolve({ id: 'match-1' }),
    });
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe('INTERNAL_ERROR');
  });

  it('deve retornar 200 quando updateMatch retorna objeto com error (simplified handler não valida)', async () => {
    mockUpdateMatch.mockResolvedValue({ error: 'VERSION_CONFLICT' } as any);

    const res = await handlePutMatch(putReq({ version: 1, nickname: 'x' }), {
      params: Promise.resolve({ id: 'match-1' }),
    });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.error).toBe('VERSION_CONFLICT');
  });

  it('deve ignorar campos extras do body (passa direto para updateMatch)', async () => {
    mockUpdateMatch.mockResolvedValue({ id: 'match-1' } as any);

    await handlePutMatch(putReq({ dangerous: 'injection', nickname: 'ok' }), {
      params: Promise.resolve({ id: 'match-1' }),
    });

    expect(mockUpdateMatch).toHaveBeenCalledWith('match-1', {
      dangerous: 'injection',
      nickname: 'ok',
    });
  });
});

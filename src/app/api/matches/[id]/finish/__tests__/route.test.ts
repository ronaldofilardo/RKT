import { NextRequest } from 'next/server';

jest.mock('@/services/matchService', () => ({
  finishMatch: jest.fn(),
}));

import { POST } from '@/app/api/matches/[id]/finish/route';
import { finishMatch } from '@/services/matchService';
import { makeAuthHeadersSync } from '@/test-helpers/auth';

const mockFinishMatch = finishMatch as jest.MockedFunction<typeof finishMatch>;
const ATHLETE = makeAuthHeadersSync('user-1', 'ATHLETE');

function finishReq(body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest('http://localhost:3000/api/matches/match-1/finish', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json', ...ATHLETE, ...headers },
  });
}

describe('POST /api/matches/[id]/finish', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve retornar 200 ao finalizar partida com sucesso', async () => {
    mockFinishMatch.mockResolvedValue({ id: 'match-1', state: 'FINISHED' } as any);

    const res = await POST(finishReq({ reason: 'COMPLETED' }), {
      params: Promise.resolve({ id: 'match-1' }),
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.state).toBe('FINISHED');
    expect(mockFinishMatch).toHaveBeenCalledWith(
      'match-1',
      undefined,
      { reason: 'COMPLETED', note: undefined },
    );
  });

  it('deve repassar note e scoreState ao service', async () => {
    mockFinishMatch.mockResolvedValue({} as any);
    const scoreState = {
      sets: [],
      currentGame: { player1: 0, player2: 0 },
      server: 'player1' as const,
      isFinished: true,
      winner: 'player1' as const,
    };

    await POST(
      finishReq({ reason: 'WALKOVER', note: 'opponent withdrew', scoreState }),
      { params: Promise.resolve({ id: 'match-2' }) },
    );

    expect(mockFinishMatch).toHaveBeenCalledWith(
      'match-2',
      scoreState,
      { reason: 'WALKOVER', note: 'opponent withdrew' },
    );
  });

  it('deve retornar 404 quando service retorna null (partida inexistente)', async () => {
    mockFinishMatch.mockResolvedValue(null);

    const res = await POST(finishReq({ reason: 'COMPLETED' }), {
      params: Promise.resolve({ id: 'missing' }),
    });
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe('MATCH_NOT_FOUND');
  });

  it('deve retornar 422 quando service retorna erro de domínio', async () => {
    mockFinishMatch.mockResolvedValue({ error: 'INCOMPLETE_SCORING' } as any);

    const res = await POST(finishReq({ reason: 'COMPLETED' }), {
      params: Promise.resolve({ id: 'match-1' }),
    });
    const body = await res.json();

    expect(res.status).toBe(422);
    expect(body.error).toBe('INCOMPLETE_SCORING');
  });

  it('deve retornar 400 com reason inválida', async () => {
    const res = await POST(finishReq({ reason: 'BOGUS' }), {
      params: Promise.resolve({ id: 'match-1' }),
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('VALIDATION_ERROR');
    expect(mockFinishMatch).not.toHaveBeenCalled();
  });

  it('deve retornar 400 com note > 500 chars', async () => {
    const res = await POST(finishReq({ reason: 'COMPLETED', note: 'x'.repeat(501) }), {
      params: Promise.resolve({ id: 'match-1' }),
    });

    expect(res.status).toBe(400);
  });

  it('deve retornar 500 em erro inesperado', async () => {
    mockFinishMatch.mockRejectedValue(new Error('boom'));

    const res = await POST(finishReq({ reason: 'COMPLETED' }), {
      params: Promise.resolve({ id: 'match-1' }),
    });

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('INTERNAL_ERROR');
  });
});

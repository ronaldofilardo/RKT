jest.mock('@/lib/jwt-client', () => ({
  decodeJwtPayload: jest.fn(),
}));

import { decodeJwtPayload } from '@/lib/jwt-client';
import { handleAuthenticated } from '@/middleware-auth.logic';
import type { NextRequest } from 'next/server';

const mockDecodeJwt = decodeJwtPayload as jest.Mock;

function makeRequest(pathname: string, token = 'valid-token'): { request: NextRequest; headers: Headers } {
  const headers = new Headers();
  const request = {
    url: `http://localhost:3000${pathname}`,
    headers: new Headers({ authorization: `Bearer ${token}` }),
    cookies: {
      get: () => undefined,
    },
    nextUrl: { pathname, search: '', searchParams: new URLSearchParams() },
  } as unknown as NextRequest;
  return { request, headers };
}

describe('Middleware Context & Area Propagation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('propaga x-user-context, x-active-ct e x-active-area para API quando usuário tem CT ativo', async () => {
    mockDecodeJwt.mockResolvedValue({
      sub: 'user-coach-1',
      role: 'ANNOTATOR',
      mk: 'TREINADOR',
      cx: 'ct-rkt-1',
      ct: 'ct-rkt-1',
      ax: 'TREINADOR_CLUBE',
    });

    const { request, headers } = makeRequest('/api/auth/me');
    await handleAuthenticated(request, headers);

    expect(headers.get('x-user-id')).toBe('user-coach-1');
    expect(headers.get('x-user-role')).toBe('ANNOTATOR');
    expect(headers.get('x-user-context')).toBe('ct-rkt-1');
    expect(headers.get('x-active-ct')).toBe('ct-rkt-1');
    expect(headers.get('x-active-area')).toBe('TREINADOR_CLUBE');
  });

  it('propaga x-user-context=PARTICULAR e x-active-area=TREINADOR_AVULSO quando contexto é particular', async () => {
    mockDecodeJwt.mockResolvedValue({
      sub: 'user-coach-1',
      role: 'ANNOTATOR',
      mk: 'TREINADOR',
      cx: 'PARTICULAR',
      ax: 'TREINADOR_AVULSO',
    });

    const { request, headers } = makeRequest('/api/matches');
    await handleAuthenticated(request, headers);

    expect(headers.get('x-user-id')).toBe('user-coach-1');
    expect(headers.get('x-user-role')).toBe('ANNOTATOR');
    expect(headers.get('x-user-context')).toBe('PARTICULAR');
    expect(headers.get('x-active-ct')).toBeNull();
    expect(headers.get('x-active-area')).toBe('TREINADOR_AVULSO');
  });
});

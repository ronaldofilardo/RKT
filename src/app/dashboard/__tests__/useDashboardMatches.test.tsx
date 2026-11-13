/**
 * @jest-environment jsdom
 *
 * Fase E do plano de filtros: `/api/matches` com resultado discriminado.
 * - HTTP 500 e timeout viram mensagem de erro (nunca lista vazia silenciosa);
 * - `nextCursor` + "Carregar mais" pagina sem perder a primeira página;
 * - falha de `/api/matches/suspended-sessions` não apaga a lista principal.
 */
import { act, renderHook, waitFor } from '@testing-library/react';
import { useDashboardData } from '@/app/dashboard/hooks/useDashboardMatches';
import { fetchMatchesEndpoint } from '@/app/dashboard/hooks/use-dashboard-matches-fetch';
import { TIMEOUTS } from '@/lib/constants';

jest.mock('@/lib/auth-client', () => ({
  readAuthState: jest.fn(() => ({ userRole: 'ANNOTATOR', userId: 'u1' })),
  ensureAuthCookie: jest.fn(() => true),
  redirectToLogin: jest.fn(),
}));
jest.mock('@/lib/jwt-client', () => ({
  isTokenExpired: jest.fn(() => false),
}));
jest.mock('@/hooks/useSessionManager.pending-abandon', () => ({
  flushPendingAbandons: jest.fn(() => Promise.resolve()),
}));

type RouteReply = { status?: number; body?: unknown };

function stubFetch(resolveRoute: (url: string) => RouteReply) {
  const calls: string[] = [];
  global.fetch = jest.fn((input: unknown) => {
    const url = String(input);
    calls.push(url);
    const { status = 200, body = {} } = resolveRoute(url);
    return Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(body),
    }) as unknown as Promise<Response>;
  }) as unknown as typeof fetch;
  return calls;
}

const match = (id: string) => ({
  id,
  state: 'SCHEDULED',
  format: 'BEST_OF_3',
  player1: { id: 'p1', name: 'P1' },
  player2: { id: 'p2', name: 'P2' },
});

const onlySuspendedOk = (url: string): RouteReply =>
  url.includes('suspended-sessions')
    ? { body: { data: { sessions: [] } } }
    : { body: { data: { matches: [], nextCursor: null } } };

describe('useDashboardData (paginação e erros visíveis)', () => {
  const originalConsoleError = console.error;

  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();
    sessionStorage.setItem('access_token', 'token');
    sessionStorage.setItem('user_role', 'ANNOTATOR');
    sessionStorage.setItem('user_id', 'u1');
  });

  afterEach(() => {
    console.error = originalConsoleError;
    jest.useRealTimers();
  });

  it('HTTP 500 expõe mensagem de erro em vez de fingir lista vazia', async () => {
    stubFetch((url) => (url.includes('suspended-sessions') ? { body: {} } : { status: 500 }));

    const { result } = renderHook(() => useDashboardData());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.errorMessage).toBe('Não foi possível carregar as partidas.');
    expect(result.current.matches).toEqual([]);
  });

  it('HTTP 200 sem partidas é estado vazio legítimo (sem mensagem de erro)', async () => {
    stubFetch(onlySuspendedOk);

    const { result } = renderHook(() => useDashboardData());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.matches).toEqual([]);
    expect(result.current.errorMessage).toBeNull();
  });

  it('falha de /api/matches/suspended-sessions não apaga a lista principal', async () => {
    stubFetch((url) =>
      url.includes('suspended-sessions')
        ? { status: 500 }
        : { body: { data: { matches: [match('m1')], nextCursor: null } } },
    );

    const { result } = renderHook(() => useDashboardData());

    await waitFor(() => expect(result.current.matches).toHaveLength(1));
    expect(result.current.errorMessage).toBeNull();
    expect(result.current.suspendedFromApi).toEqual([]);
  });

  it('pagina com nextCursor + loadMore preservando a primeira página', async () => {
    const calls = stubFetch((url) => {
      if (url.includes('suspended-sessions')) return { body: {} };
      if (url.includes('cursor=c1')) return { body: { data: { matches: [match('m2')], nextCursor: null } } };
      return { body: { data: { matches: [match('m1')], nextCursor: 'c1' } } };
    });

    const { result } = renderHook(() => useDashboardData());

    await waitFor(() => expect(result.current.matches).toHaveLength(1));
    expect(result.current.nextCursor).toBe('c1');
    expect(calls[0]).toContain('limit=50');

    await act(async () => {
      await result.current.loadMore();
    });

    expect(result.current.matches.map((m) => m.id)).toEqual(['m1', 'm2']);
    expect(result.current.nextCursor).toBeNull();
    expect(calls).toContainEqual(expect.stringContaining('cursor=c1'));
  });

  it('timeout (AbortError) vira "Tempo esgotado" e não lista vazia', async () => {
    jest.useFakeTimers();
    global.fetch = jest.fn((_input: unknown, init?: RequestInit) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () =>
          reject(Object.assign(new Error('aborted'), { name: 'AbortError' })),
        );
      }),
    ) as unknown as typeof fetch;

    const pending = fetchMatchesEndpoint('/api/matches', null);
    await jest.advanceTimersByTimeAsync(TIMEOUTS.MATCH_FETCH_TIMEOUT_MS + 1);

    await expect(pending).resolves.toEqual({
      ok: false,
      errorMessage: 'Tempo esgotado ao carregar as partidas.',
    });
  });

  it('"Tentar de novo" (fetchDashboardData) recupera a lista após uma falha', async () => {
    let fail = true;
    stubFetch((url) => {
      if (url.includes('suspended-sessions')) return { body: {} };
      return fail
        ? { status: 500 }
        : { body: { data: { matches: [match('m9')], nextCursor: null } } };
    });

    const { result } = renderHook(() => useDashboardData());
    await waitFor(() => expect(result.current.errorMessage).not.toBeNull());

    fail = false;
    await act(async () => {
      result.current.fetchDashboardData();
    });

    await waitFor(() => expect(result.current.matches).toHaveLength(1));
    expect(result.current.errorMessage).toBeNull();
    expect(result.current.matches[0].id).toBe('m9');
  });
});

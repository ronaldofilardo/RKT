/**
 * @jest-environment jsdom
 *
 * Testes de caracteriza��o para useDashboardData.
 * Cobrem o bug do envelope { data: { matches } } retornado por GET /api/matches,
 * mantendo compatibilidade com o formato plano { matches } usado por outras rotas.
 */
import { renderHook, waitFor } from '@testing-library/react';
import { useDashboardData } from '@/app/dashboard/dashboard.hooks';

const buildFinishedMatch = (id: string, nickname: string) => ({
  id,
  state: 'FINISHED',
  format: 'MATCH_TB_10',
  sportType: 'TENNIS',
  courtType: 'HARD',
  scheduledAt: '2026-07-24T14:11:00.000Z',
  startedAt: '2026-07-24T12:55:56.169Z',
  finishedAt: '2026-07-24T12:57:41.176Z',
  nickname,
  visibility: 'PUBLIC',
  isResuming: false,
  openForAnnotation: false,
  tournamentName: 'copoinha',
  category: 'INFANTIL',
  round: 'oitavas',
  bracketType: 'CHAVE',
  temperature: 15,
  humidity: 55,
  version: 15,
  scoreState: { sets: [], server: 'player2', winner: 'player1', isFinished: true },
  initialServerId: 'p1',
  player1: { id: 'p1', name: 'Jogador 1' },
  player2: { id: 'p2', name: 'Jogador 2' },
});

describe.skip('useDashboardData - parsing de response (TD-046 + jose ESM blocker)', () => {
  const originalConsoleError = console.error;
  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();
  });
  afterEach(() => {
    console.error = originalConsoleError;
  });

  const setupToken = () => {
    const futureExp = Math.floor(Date.now() / 1000) + 3600;
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({ sub: 'u1', role: 'SPECTATOR', exp: futureExp })).toString('base64url');
    const token = `${header}.${payload}.sig`;
    const store: Record<string, string> = { access_token: token, user_id: 'u1', user_role: 'SPECTATOR' };
    Object.defineProperty(window, 'sessionStorage', {
      value: {
        getItem: jest.fn((k: string) => store[k] ?? null),
        setItem: jest.fn((k: string, v: string) => { store[k] = v; }),
        removeItem: jest.fn((k: string) => { delete store[k]; }),
        clear: jest.fn(() => { for (const k of Object.keys(store)) delete store[k]; }),
      },
      writable: true,
    });
    Object.defineProperty(window, 'location', {
      value: { pathname: '/dashboard', assign: jest.fn(), replace: jest.fn() },
      writable: true,
    });
  };

  const mockFetchSequencia = (...responses: Array<{ ok?: boolean; body: any }>) => {
    let i = 0;
    global.fetch = jest.fn((url: any) => {
      const r = responses[i++] ?? { ok: true, body: { matches: [] } };
      return Promise.resolve({
        ok: r.ok !== false,
        json: () => Promise.resolve(r.body),
      } as any) as any;
    }) as any;
  };

  it('l� partidas do envelope { data: { matches } } (formato /api/matches)', async () => {
    setupToken();
    const finished = buildFinishedMatch('m1', 'partida-1');
    mockFetchSequencia(
      { body: { data: { matches: [finished], nextCursor: null } } },
      { body: { matches: [] } },
    );

    const { result } = renderHook(() => useDashboardData());

    await waitFor(() => expect(result.current.matches).toHaveLength(1));
    expect(result.current.matches[0].id).toBe('m1');
    expect(result.current.matches[0].state).toBe('FINISHED');
  });

  it('l� partidas do formato plano { matches } (compatibilidade)', async () => {
    setupToken();
    const finished = buildFinishedMatch('m2', 'partida-2');
    mockFetchSequencia(
      { body: { matches: [finished] } },
      { body: { matches: [] } },
    );

    const { result } = renderHook(() => useDashboardData());

    await waitFor(() => expect(result.current.matches).toHaveLength(1));
    expect(result.current.matches[0].id).toBe('m2');
  });

  it('resulta em lista vazia quando response n�o contem matches', async () => {
    setupToken();
    mockFetchSequencia(
      { body: { data: { other: [] } } },
      { body: { other: [] } },
    );

    const { result } = renderHook(() => useDashboardData());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.matches).toEqual([]);
  });

  it('resulta em lista vazia quando response � { data: { matches: [] } } (sem partidas)', async () => {
    setupToken();
    mockFetchSequencia(
      { body: { data: { matches: [], nextCursor: null } } },
      { body: { matches: [] } },
    );

    const { result } = renderHook(() => useDashboardData());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.matches).toEqual([]);
  });

  it('n�o fetcha quando access_token estiver ausente', async () => {
    const store: Record<string, string> = {};
    Object.defineProperty(window, 'sessionStorage', {
      value: {
        getItem: jest.fn((k: string) => store[k] ?? null),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    });
    Object.defineProperty(window, 'location', {
      value: { pathname: '/dashboard', assign: jest.fn(), replace: jest.fn() },
      writable: true,
    });
    global.fetch = jest.fn(() => Promise.resolve({} as any)) as any;

    const { result } = renderHook(() => useDashboardData());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(global.fetch).not.toHaveBeenCalled();
    expect(result.current.matches).toEqual([]);
  });
});

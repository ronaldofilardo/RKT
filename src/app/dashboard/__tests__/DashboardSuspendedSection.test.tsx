/**
 * @jest-environment jsdom
 *
 * Testes para a renderização da seção "Anotações Suspensas" no DashboardPage.
 * Valida que partidas com suspendedSessionId/matchStateSnapshot vindas de
 * /api/matches/suspended-sessions são exibidas no topo da view padrão.
 */
import { render, screen, waitFor } from '@testing-library/react';
import DashboardPage from '@/app/dashboard/page';
import { useRouter, usePathname } from 'next/navigation';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

jest.mock('@/components/dashboard/MatchCard', () => ({
  MatchCard: ({ match }: any) => (
    <div data-testid="match-card" data-match-id={match.id}>
      {match.suspendedSessionId ? `SUSPENDED:${match.id}` : match.id}
    </div>
  ),
}));

jest.mock('@/components/Toast', () => ({
  useToast: () => ({ toast: jest.fn() }),
}));

jest.mock('@/contexts/SessionContext', () => ({
  useSession: () => ({
    setSession: jest.fn(),
    setPendingEdit: jest.fn(),
    writeToSessionStorage: jest.fn(),
  }),
}));

jest.mock('@/lib/matchConfig', () => ({
  getMatchFormatRules: jest.fn(),
  validateSetScore: jest.fn(),
  isMatchTiebreakActive: jest.fn(),
}));

const buildJwt = (payload: object): string => {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const p = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${p}.sig`;
};

const setupAuth = () => {
  const futureExp = Math.floor(Date.now() / 1000) + 3600;
  const token = buildJwt({ sub: 'u', exp: futureExp });
  const store: Record<string, string> = {
    user_id: 'user-1',
    user_role: 'ATHLETE',
    access_token: token,
  };
  Object.defineProperty(window, 'sessionStorage', {
    value: {
      getItem: jest.fn((k: string) => store[k] ?? null),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    },
    writable: true,
  });
};

describe('DashboardPage - seção Anotações Suspensas (TD-046)', () => {
  const mockRouter = { push: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (usePathname as jest.Mock).mockReturnValue('/dashboard');
  });

  it('renderiza partidas suspensas vindas da API', async () => {
    setupAuth();
    const suspended = {
      id: 'm-suspended-1',
      suspendedSessionId: 'sess-1',
      matchStateSnapshot: '{"sets":[]}',
      state: 'IN_PROGRESS',
      format: 'SET_6',
      sportType: 'TENNIS',
      player1: { id: 'p1', name: 'A' },
      player2: { id: 'p2', name: 'B' },
    };
    global.fetch = jest.fn((url: any) => {
      if (url.includes('suspended-sessions')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: { matches: [suspended] } }),
        } as any) as any;
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ matches: [] }),
      } as any) as any;
    }) as any;

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/Anotações Suspensas/i)).toBeInTheDocument();
    });
    expect(screen.getByText('SUSPENDED:m-suspended-1')).toBeInTheDocument();
  });

  it('não renderiza a seção quando suspendedFromApi está vazia', async () => {
    setupAuth();
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ matches: [] }),
      } as any)
    ) as any;

    render(<DashboardPage />);

    await waitFor(() => screen.getByTestId('hamburger-menu-button'));
    expect(screen.queryByText(/Anotações Suspensas/i)).not.toBeInTheDocument();
  });
});

/**
 * @jest-environment jsdom
 *
 * Testes da view "Relatórios" no DashboardPage.
 * Validam que partidas com state=FINISHED são listadas com foco em timeline/relatório em /relatorios.
 */
import { render, screen, waitFor } from '@testing-library/react';
import DashboardPage from '@/app/dashboard/page';
import { useRouter, usePathname } from 'next/navigation';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

jest.mock('@/components/dashboard/MatchCard', () => ({
  MatchCard: ({ match, onClick, onReport }: any) => (
    <div
      data-testid="match-card"
      role="button"
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick ? () => onClick(match) : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter') onClick(match); } : undefined}
    >
      {match.player1?.name} vs {match.player2?.name}
      {onReport && (
        <button data-testid={`report-${match.id}`} onClick={() => onReport(match)}>
          Relatório
        </button>
      )}
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

const buildFinishedMatch = (id: string, name1: string, name2: string) => ({
  id,
  state: 'FINISHED',
  format: 'MATCH_TB_10',
  sportType: 'TENNIS',
  courtType: 'HARD',
  scheduledAt: '2026-07-24T14:11:00.000Z',
  startedAt: '2026-07-24T12:55:56.169Z',
  finishedAt: '2026-07-24T12:57:41.176Z',
  nickname: null,
  visibility: 'PUBLIC',
  isResuming: false,
  openForAnnotation: false,
  scoreState: { sets: [], server: 'player2', winner: 'player1', isFinished: true },
  initialServerId: 'p1',
  player1: { id: 'p1', name: name1 },
  player2: { id: 'p2', name: name2 },
});

const setupSessionStorage = () => {
  const store: Record<string, string> = {
    user_id: 'user-123',
    user_role: 'ATHLETE',
    access_token: 'token-xyz',
  };
  Object.defineProperty(window, 'sessionStorage', {
    value: {
      getItem: jest.fn((k: string) => store[k] ?? null),
      setItem: jest.fn((k: string, v: string) => { store[k] = v; }),
      removeItem: jest.fn((k: string) => { delete store[k]; }),
      clear: jest.fn(),
    },
    writable: true,
  });
};

describe('DashboardPage - view "Relatórios"', () => {
  const mockRouter = { push: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ matches: [] }),
      } as any)
    ) as any;
  });

  it('exibe cabeçalho "Relatórios" e lista partidas finalizadas', async () => {
    setupSessionStorage();
    const finished = buildFinishedMatch('m-rep-1', 'Guga Kuerten', 'Roger Federer');
    (usePathname as jest.Mock).mockReturnValue('/relatorios');

    global.fetch = jest.fn((url: any) => {
      const s = String(url);
      if (s.includes('auth/me')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ user: { role: 'COACH' }, memberships: [] }) } as any);
      }
      if (s.includes('suspended-sessions')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ matches: [] }) } as any);
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ data: { matches: [finished], nextCursor: null } }) } as any);
    }) as any;

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Relatórios/i })).toBeInTheDocument();
    });
    expect(screen.getByText(/Guga Kuerten/)).toBeInTheDocument();
    expect(screen.getByText(/Roger Federer/)).toBeInTheDocument();
  });

  it('clicar no card navega para a timeline da partida finalizada', async () => {
    setupSessionStorage();
    const finished = buildFinishedMatch('m-rep-1', 'Guga Kuerten', 'Roger Federer');
    (usePathname as jest.Mock).mockReturnValue('/relatorios');

    global.fetch = jest.fn((url: any) => {
      const s = String(url);
      if (s.includes('auth/me')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ user: { role: 'COACH' }, memberships: [] }) } as any);
      }
      if (s.includes('suspended-sessions')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ matches: [] }) } as any);
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ data: { matches: [finished], nextCursor: null } }) } as any);
    }) as any;

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByTestId('match-card')).toBeInTheDocument();
    });

    screen.getByTestId('match-card').click();
    expect(mockRouter.push).toHaveBeenCalledWith('/match/m-rep-1/report?tab=timeline');
  });

  it('exibe mensagem vazia quando não há partidas finalizadas com relatório', async () => {
    setupSessionStorage();
    (usePathname as jest.Mock).mockReturnValue('/relatorios');

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: { matches: [], nextCursor: null } }),
      } as any) as any
    ) as any;

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/Nenhuma partida finalizada com relatório encontrada/i)).toBeInTheDocument();
    });
  });
});

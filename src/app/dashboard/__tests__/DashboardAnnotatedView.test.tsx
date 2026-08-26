/**
 * @jest-environment jsdom
 *
 * Testes de caracteriza��o da view "Partidas Anotadas" no DashboardPage.
 * Validam que partidas com state=FINISHED s�o listadas em /partidasanotadas
 * e que o estado vazio � exibido quando n�o h� partidas finalizadas.
 *
 * TD-046 — Sprint 0: testes pulados aguardando restaura��o do dashboard
 * (commit 1511b97 reduziu o componente de 448L para stub de 7L).
 */
// describe.skip abaixo substitui describe nesta suite enquanto TD-046 n�o fecha.
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
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick(match);
        }
      }}
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
  tournamentName: 'copoinha',
  category: 'INFANTIL',
  round: 'oitavas',
  bracketType: 'CHAVE',
  temperature: 15,
  humidity: 55,
  version: 15,
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
      clear: jest.fn(() => { for (const k of Object.keys(store)) delete store[k]; }),
    },
    writable: true,
  });
};

describe('DashboardPage - view "Partidas Anotadas" (TD-046)', () => {
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

  it('lista partidas com state=FINISHED', async () => {
    setupSessionStorage();
    const finished = buildFinishedMatch('cmryy1d8d', 'Figs Old Man', 'dfdsf dsfdfs');
    (usePathname as jest.Mock).mockReturnValue('/partidasanotadas');

    let first = true;
    global.fetch = jest.fn((url: any) => {
      const body = first
        ? { data: { matches: [finished], nextCursor: null } }
        : { matches: [] };
      first = false;
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(body),
      } as any) as any;
    }) as any;

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByTestId('match-card')).toBeInTheDocument();
    });
    expect(screen.getByText(/Figs Old Man/)).toBeInTheDocument();
    expect(screen.getByText(/dfdsf dsfdfs/)).toBeInTheDocument();
    expect(mockRouter.push).not.toHaveBeenCalledWith('/login');
    expect(mockRouter.push).not.toHaveBeenCalledWith('/');
  });

  it('exibe estado vazio quando n�o h� partidas finalizadas', async () => {
    setupSessionStorage();
    (usePathname as jest.Mock).mockReturnValue('/partidasanotadas');

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: { matches: [], nextCursor: null } }),
      } as any) as any
    ) as any;

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/Nenhuma partida anotada encontrada/i)).toBeInTheDocument();
    });
    expect(screen.queryByTestId('match-card')).not.toBeInTheDocument();
  });

  it('navega para In�cio ao clicar em Voltar quando n�o h� partidas', async () => {
    setupSessionStorage();
    (usePathname as jest.Mock).mockReturnValue('/partidasanotadas');

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ matches: [] }),
      } as any) as any
    ) as any;

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/Nenhuma partida anotada encontrada/i)).toBeInTheDocument();
    });

    screen.getByText(/Voltar para Início/i).click();
    expect(mockRouter.push).toHaveBeenCalledWith('/dashboard');
  });

  it('exibe cabe�alho "Partidas Anotadas"', async () => {
    setupSessionStorage();
    (usePathname as jest.Mock).mockReturnValue('/partidasanotadas');

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ matches: [] }),
      } as any) as any
    ) as any;

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Partidas Anotadas/i })).toBeInTheDocument();
    });
  });

  it('n�o lista partidas SCHEDULED ou IN_PROGRESS na se��o Partidas Anotadas', async () => {
    setupSessionStorage();
    const scheduled = { ...buildFinishedMatch('m-sched', 'A', 'B'), state: 'SCHEDULED' };
    const inProgress = { ...buildFinishedMatch('m-prog', 'C', 'D'), state: 'IN_PROGRESS' };
    (usePathname as jest.Mock).mockReturnValue('/partidasanotadas');

    let first = true;
    global.fetch = jest.fn(() => {
      const body = first
        ? { data: { matches: [scheduled, inProgress], nextCursor: null } }
        : { matches: [] };
      first = false;
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(body),
      } as any) as any;
    }) as any;

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/Nenhuma partida anotada encontrada/i)).toBeInTheDocument();
    });
    expect(
      screen.queryByTestId('report-m-sched'),
    ).not.toBeInTheDocument();
  });

  it('clicar no card de partida anotada navega para /match/[id]/report (timeline)', async () => {
    setupSessionStorage();
    const finished = buildFinishedMatch('match-xyz', 'Alice', 'Bob');
    (usePathname as jest.Mock).mockReturnValue('/partidasanotadas');

    let first = true;
    global.fetch = jest.fn((url: any) => {
      const body = first
        ? { data: { matches: [finished], nextCursor: null } }
        : { matches: [] };
      first = false;
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(body),
      } as any) as any;
    }) as any;

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByTestId('match-card')).toBeInTheDocument();
    });

    screen.getByTestId('match-card').click();
    expect(mockRouter.push).toHaveBeenCalledWith('/match/match-xyz/report');
  });
});

/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react';
import DashboardPage from '@/app/dashboard/page';
import { useRouter, usePathname } from 'next/navigation';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

jest.mock('@/components/dashboard/MatchCard', () => ({
  MatchCard: () => <div data-testid="match-card" />,
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

const setupAuth = () => {
  const futureExp = Math.floor(Date.now() / 1000) + 3600;
  const payload = Buffer.from(JSON.stringify({ sub: 'user-1', exp: futureExp })).toString('base64url');
  sessionStorage.setItem('user_id', 'user-1');
  sessionStorage.setItem('user_role', 'ANNOTATOR');
  sessionStorage.setItem('access_token', `header.${payload}.sig`);
};

const mockFetchForArea = (activeArea: string | null) => {
  global.fetch = jest.fn((url: unknown) => {
    if (String(url).includes('/api/auth/me')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ user: { id: 'user-1' }, activeArea }),
      });
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve({ matches: [] }) });
  }) as any;
};

describe('DashboardPage — empty state contextual', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: jest.fn() });
    (usePathname as jest.Mock).mockReturnValue('/dashboard');
    setupAuth();
  });

  it('exibe o empty state do atleta com CTA para a nova partida', async () => {
    mockFetchForArea('ATLETA');
    render(<DashboardPage />);

    expect(await screen.findByText('Bem-vindo à sua central de telemetria')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Criar Minha Primeira Partida/ })).toHaveAttribute(
      'href',
      '/atleta/match/new',
    );
  });

  it('exibe o empty state do gestor com CTAs das abas', async () => {
    mockFetchForArea('GESTOR');
    render(<DashboardPage />);

    expect(await screen.findByText('Seu Centro de Treinamento está pronto')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Cadastrar Treinadores/ })).toHaveAttribute(
      'href',
      '/clube/gestor?tab=coaches',
    );
  });

  it('mantém a mensagem genérica para perfil sem empty state dedicado', async () => {
    mockFetchForArea('ANOTADOR');
    render(<DashboardPage />);

    await waitFor(() => expect(screen.queryByText('Carregando...')).not.toBeInTheDocument());
    expect(screen.getByText('Nenhuma partida por aqui ainda.')).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /Criar Minha Primeira Partida|Nova Partida|Cadastrar/ }),
    ).not.toBeInTheDocument();
  });
});

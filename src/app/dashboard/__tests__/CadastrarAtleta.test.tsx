/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DashboardPage from '@/app/dashboard/page';
import { useRouter, usePathname } from 'next/navigation';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

jest.mock('@/components/dashboard/MatchCard', () => ({
  MatchCard: ({ match, onClick, onReport }: any) => (
    <div data-testid="match-card" onClick={() => onClick?.(match)}>
      {match.player1?.name} vs {match.player2?.name}
    </div>
  ),
}));

jest.mock('@/components/Toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

jest.mock('@/app/match/new/components/NewAthleteModal', () => ({
  NewAthleteModal: ({ isOpen, onClose, onCreated }: any) =>
    isOpen ? (
      <div data-testid="new-athlete-modal">
        <button onClick={onClose}>Fechar</button>
        <button onClick={() => onCreated({ id: 'new-1', name: 'Novo Atleta' })}>
          Salvar
        </button>
      </div>
    ) : null,
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

describe('DashboardPage - Cadastrar Atleta', () => {
  const mockRouter = {
    push: jest.fn(),
  };

  const setupSessionStorage = (userId: string, userRole: string) => {
    const sessionStorageMock = {
      getItem: jest.fn((key: string) => {
        if (key === 'user_id') return userId;
        if (key === 'user_role') return userRole;
        return null;
      }),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    };
    Object.defineProperty(window, 'sessionStorage', {
      value: sessionStorageMock,
      writable: true,
    });
    return sessionStorageMock;
  };

  const openMenu = async () => {
    const menuButton = await waitFor(() => {
      return screen.getByTestId('hamburger-menu-button');
    });
    fireEvent.click(menuButton);
    await waitFor(() => {
      expect(screen.getByText(/menu/i)).toBeInTheDocument();
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (usePathname as jest.Mock).mockReturnValue('/dashboard');

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ matches: [] }),
      } as any)
    ) as jest.Mock;
  });

  it('deve mostrar opção Cadastrar Atleta no menu', async () => {
    setupSessionStorage('user-123', 'ATHLETE');

    render(<DashboardPage />);

    await openMenu();

    const cadastrarAtletaItem = screen.getByText(/cadastrar atleta/i);
    expect(cadastrarAtletaItem).toBeInTheDocument();
  });

  it('deve mostrar opção Cadastrar Atleta abaixo de Ao Vivo', async () => {
    setupSessionStorage('user-123', 'ATHLETE');

    render(<DashboardPage />);

    await openMenu();

    const aoVivoItem = screen.getByText(/ao vivo/i);
    const cadastrarAtletaItem = screen.getByText(/cadastrar atleta/i);

    expect(aoVivoItem).toBeInTheDocument();
    expect(cadastrarAtletaItem).toBeInTheDocument();

    const menu = screen.getByRole('navigation') || screen.getByText(/menu/i).closest('nav');
    if (menu) {
      const allButtons = menu.querySelectorAll('button');
      const aoVivoIndex = Array.from(allButtons).findIndex(
        btn => btn.textContent?.includes('Ao Vivo')
      );
      const cadastrarAtletaIndex = Array.from(allButtons).findIndex(
        btn => btn.textContent?.includes('Cadastrar Atleta')
      );

      expect(cadastrarAtletaIndex).toBeGreaterThan(aoVivoIndex);
    }
  });

  it('deve abrir modal de novo atleta ao clicar em Cadastrar Atleta', async () => {
    setupSessionStorage('user-123', 'ATHLETE');

    render(<DashboardPage />);

    await openMenu();

    const cadastrarAtletaItem = screen.getByText(/cadastrar atleta/i);
    fireEvent.click(cadastrarAtletaItem);

    await waitFor(() => {
      expect(screen.getByTestId('new-athlete-modal')).toBeInTheDocument();
    });
  });

  it('deve fechar modal após criar atleta com sucesso', async () => {
    setupSessionStorage('user-123', 'ATHLETE');

    render(<DashboardPage />);

    await openMenu();

    const cadastrarAtletaItem = screen.getByText(/cadastrar atleta/i);
    fireEvent.click(cadastrarAtletaItem);

    await waitFor(() => {
      expect(screen.getByTestId('new-athlete-modal')).toBeInTheDocument();
    });

    const salvarButton = screen.getByText('Salvar');
    fireEvent.click(salvarButton);

    await waitFor(() => {
      expect(screen.queryByTestId('new-athlete-modal')).not.toBeInTheDocument();
    });
  });

  it('não deve mostrar Cadastrar Atleta quando menu estiver fechado', async () => {
    setupSessionStorage('user-123', 'ATHLETE');

    render(<DashboardPage />);

    expect(screen.queryByText(/cadastrar atleta/i)).not.toBeInTheDocument();
  });

  it('deve fechar menu ao clicar em Cadastrar Atleta', async () => {
    setupSessionStorage('user-123', 'ATHLETE');

    render(<DashboardPage />);

    await openMenu();

    const cadastrarAtletaItem = screen.getByText(/cadastrar atleta/i);
    fireEvent.click(cadastrarAtletaItem);

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /fechar menu/i })).not.toBeInTheDocument();
    });
  });
});
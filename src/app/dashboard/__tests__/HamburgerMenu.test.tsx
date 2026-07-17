/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DashboardPage from '@/app/dashboard/page';
import { useRouter, usePathname } from 'next/navigation';

// Mock do useRouter e usePathname
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

// Mock do MatchCard
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

// Mock do useSession
jest.mock('@/contexts/SessionContext', () => ({
  useSession: () => ({
    setSession: jest.fn(),
    setPendingEdit: jest.fn(),
    writeToSessionStorage: jest.fn(),
  }),
}));

// Mock do matchConfig
jest.mock('@/lib/matchConfig', () => ({
  getMatchFormatRules: jest.fn(),
  validateSetScore: jest.fn(),
  isMatchTiebreakActive: jest.fn(),
}));

describe('DashboardPage - Menu Hamburguer', () => {
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

    // Mock de fetch
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ matches: [] }),
      } as any)
    ) as jest.Mock;
  });

  it('deve renderizar o botão do menu hamburguer', async () => {
    setupSessionStorage('user-123', 'ATHLETE');

    render(<DashboardPage />);

    // Aguarda o loading terminar e o botão aparecer
    await waitFor(() => {
      const menuButton = screen.getByTestId('hamburger-menu-button');
      expect(menuButton).toBeInTheDocument();
    });
  });

  it('deve abrir o menu ao clicar no botão hamburguer', async () => {
    setupSessionStorage('user-123', 'ATHLETE');

    render(<DashboardPage />);

    await openMenu();

    // Verifica se o botão de fechar está presente
    expect(screen.getByRole('button', { name: /fechar menu/i })).toBeInTheDocument();
  });

  it('deve fechar o menu ao clicar no botão de fechar', async () => {
    setupSessionStorage('user-123', 'ATHLETE');

    render(<DashboardPage />);

    await openMenu();

    // Fecha o menu
    const closeButton = screen.getByRole('button', { name: /fechar menu/i });
    fireEvent.click(closeButton);

    // Verifica se o menu foi fechado
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /fechar menu/i })).not.toBeInTheDocument();
    });
  });

  it('deve navegar para Início ao clicar no item de menu Início', async () => {
    setupSessionStorage('user-123', 'ATHLETE');

    render(<DashboardPage />);

    await openMenu();

    // Pega o segundo elemento "Início" (o primeiro está no header, o segundo no menu)
    const inicioItems = screen.getAllByText(/início/i);
    const inicioItem = inicioItems[1];
    fireEvent.click(inicioItem);

    // Verifica se navegou para /dashboard
    expect(mockRouter.push).toHaveBeenCalledWith('/dashboard');
  });

  it('deve navegar para Histórico ao clicar no item de menu Histórico', async () => {
    setupSessionStorage('user-123', 'ATHLETE');

    render(<DashboardPage />);

    await openMenu();

    // Clica em Histórico
    const historyItem = screen.getByText(/histórico/i);
    fireEvent.click(historyItem);

    // Verifica se navegou para /historico
    expect(mockRouter.push).toHaveBeenCalledWith('/historico');
  });

  it('deve navegar para Partidas Anotadas ao clicar no item correspondente', async () => {
    setupSessionStorage('user-123', 'ATHLETE');

    render(<DashboardPage />);

    await openMenu();

    // Clica em Partidas Anotadas
    const annotatedItem = screen.getByText(/partidas anotadas/i);
    fireEvent.click(annotatedItem);

    // Verifica se navegou para /partidasanotadas
    expect(mockRouter.push).toHaveBeenCalledWith('/partidasanotadas');
  });

  it('deve navegar para Ao Vivo ao clicar no item correspondente', async () => {
    setupSessionStorage('user-123', 'ATHLETE');

    render(<DashboardPage />);

    await openMenu();

    // Clica em Ao Vivo
    const liveItem = screen.getByText(/ao vivo/i);
    fireEvent.click(liveItem);

    // Verifica se navegou para /partidasaovivo
    expect(mockRouter.push).toHaveBeenCalledWith('/partidasaovivo');
  });

  it('deve navegar para Aguardando ao clicar no item correspondente', async () => {
    setupSessionStorage('user-123', 'ATHLETE');

    render(<DashboardPage />);

    await openMenu();

    // Clica em Aguardando
    const pendingItem = screen.getByText(/aguardando/i);
    fireEvent.click(pendingItem);

    // Verifica se navegou para /aguardandoanotador
    expect(mockRouter.push).toHaveBeenCalledWith('/aguardandoanotador');
  });

  it('deve navegar para Dados Pessoais ao clicar no item correspondente', async () => {
    setupSessionStorage('user-123', 'ATHLETE');

    render(<DashboardPage />);

    await openMenu();

    // Clica em Dados Pessoais
    const profileItem = screen.getByText(/dados pessoais/i);
    fireEvent.click(profileItem);

    // Verifica se navegou para /dados-pessoais
    expect(mockRouter.push).toHaveBeenCalledWith('/dados-pessoais');
  });

  it('deve mostrar o item Admin no menu quando usuário for ADMIN', async () => {
    setupSessionStorage('user-123', 'ADMIN');

    render(<DashboardPage />);

    await openMenu();

    // Pega o segundo elemento "Admin" (o primeiro está no header, o segundo no menu)
    const adminItems = screen.getAllByText(/admin/i);
    expect(adminItems.length).toBeGreaterThanOrEqual(2);
    expect(adminItems[1]).toBeInTheDocument();
  });

  it('não deve mostrar o item Admin no menu quando usuário não for ADMIN', async () => {
    setupSessionStorage('user-123', 'ATHLETE');

    render(<DashboardPage />);

    await openMenu();

    // Verifica se o item Admin NÃO está presente
    expect(screen.queryByText(/admin/i)).not.toBeInTheDocument();
  });

  it('deve chamar handleLogout ao clicar no item Sair', async () => {
    const sessionStorageMock = setupSessionStorage('user-123', 'ATHLETE');

    // Mock do confirm para retornar true
    window.confirm = jest.fn(() => true);

    render(<DashboardPage />);

    await openMenu();

    // Pega o segundo elemento "Sair" (o primeiro está no header, o segundo no menu)
    const sairItems = screen.getAllByText(/sair/i);
    const logoutItem = sairItems[1];
    fireEvent.click(logoutItem);

    // Verifica se sessionStorage.clear foi chamado
    expect(sessionStorageMock.clear).toHaveBeenCalled();
    // Verifica se navegou para /login
    expect(mockRouter.push).toHaveBeenCalledWith('/login');
  });

  it('deve renderizar itens de menu com estilo adequado', async () => {
    setupSessionStorage('user-123', 'ATHLETE');

    render(<DashboardPage />);

    await openMenu();

    // Verifica que o menu tem múltiplos itens de navegação
    // Busca todos os botões que contêm emojis (padrão dos itens do menu)
    const allButtons = screen.getAllByRole('button');
    const menuButtons = allButtons.filter(btn => 
      btn.textContent?.match(/[🏠📜📝🔴⏳👤⚙️🚪]/)
    );
    
    // Deve ter pelo menos 6 itens de menu
    expect(menuButtons.length).toBeGreaterThanOrEqual(6);
    
    // Verifica que os botões têm classes de estilo adequadas
    menuButtons.forEach(btn => {
      expect(btn.className).toContain('rounded-lg');
      expect(btn.className).toContain('transition-colors');
    });
  });

});
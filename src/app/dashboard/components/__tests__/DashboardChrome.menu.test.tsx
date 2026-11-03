/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { DashboardChrome } from '../DashboardChrome';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  usePathname: () => '/dashboard',
}));
jest.mock('@/lib/auth-client', () => ({ clearAuthState: jest.fn(), performLogout: jest.fn() }));
jest.mock('@/components/ThemeToggle', () => ({ ThemeToggle: () => null }));
jest.mock('../DashboardSidebar', () => ({
  DashboardSidebar: ({ sections }: any) => {
    const logoutItem = sections?.flatMap((s: any) => s.items).find((i: any) => i.key === 'sair' || i.label === 'Sair');
    return (
      <nav data-testid="sidebar">
        sidebar
        {logoutItem && (
          <button data-testid="sidebar-logout-btn" onClick={logoutItem.action}>
            Sair Sidebar
          </button>
        )}
      </nav>
    );
  },
}));

beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => null }) as unknown as typeof fetch;
});

describe('DashboardChrome - menu hambúrguer', () => {
  it('por padrão renderiza o hambúrguer e a barra lateral', () => {
    render(<DashboardChrome title="Início" />);
    expect(screen.getByTestId('hamburger-menu-button')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
  });

  it('com showMenu=false não renderiza hambúrguer nem barra lateral', () => {
    render(<DashboardChrome title="Painel do Gestor" showMenu={false} />);
    expect(screen.queryByTestId('hamburger-menu-button')).not.toBeInTheDocument();
    expect(screen.queryByTestId('sidebar')).not.toBeInTheDocument();
    expect(screen.getByText('Painel do Gestor')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sair' })).toBeInTheDocument();
  });

  it('com showLogout=false abre a confirmação de logout ao clicar em Sair na sidebar', () => {
    render(<DashboardChrome title="Painel do Suporte" showLogout={false} />);
    expect(screen.queryByRole('button', { name: 'Sair' })).not.toBeInTheDocument();
    const sidebarLogout = screen.getByTestId('sidebar-logout-btn');
    fireEvent.click(sidebarLogout);
    expect(screen.getByText('Deseja realmente sair?')).toBeInTheDocument();
  });
});

/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { DashboardChrome } from '../DashboardChrome';

jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn(), replace: jest.fn() }) }));
jest.mock('@/lib/auth-client', () => ({ clearAuthState: jest.fn() }));
jest.mock('@/components/ThemeToggle', () => ({ ThemeToggle: () => null }));
jest.mock('../DashboardSidebar', () => ({
  DashboardSidebar: () => <nav data-testid="sidebar">sidebar</nav>,
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
});

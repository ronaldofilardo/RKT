/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { DashboardTopBar } from '../DashboardTopBar';

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

describe('DashboardTopBar', () => {
  const base = {
    menuOpen: false,
    setMenuOpen: jest.fn(),
    user: { name: 'Eduardo', role: 'ANNOTATOR' },
    onNewMatch: jest.fn(),
    onLogout: jest.fn(),
  };

  it('exibe o primeiro nome do usuário autenticado no header', () => {
    render(<DashboardTopBar {...base} user={{ name: 'Guilherme Igeski Stencel', role: 'ANNOTATOR' }} />);
    expect(screen.getByText('Guilherme')).toBeInTheDocument();
  });

  it('exibe o primeiro nome para Administrador do Sistema', () => {
    render(<DashboardTopBar {...base} user={{ name: 'Administrador do Sistema', role: 'ADMIN' }} />);
    expect(screen.getByText('Administrador')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('mostra o menu hambúrguer e a logo RKT por padrão', () => {
    render(<DashboardTopBar {...base} />);
    expect(screen.getByTestId('hamburger-menu-button')).toBeInTheDocument();
    expect(screen.getByAltText('RKT Tennis')).toBeInTheDocument();
  });

  it('renderiza botao de voltar para treinador/anotador em telas internas e chama onBack', () => {
    const onBack = jest.fn();
    render(<DashboardTopBar {...base} title="Relatórios" onBack={onBack} />);
    const backBtn = screen.getByTestId('header-back-button');
    expect(backBtn).toBeInTheDocument();
    fireEvent.click(backBtn);
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('nao renderiza botao de voltar na tela de inicio (title="Início")', () => {
    render(<DashboardTopBar {...base} title="Início" />);
    expect(screen.queryByTestId('header-back-button')).toBeNull();
  });

  it('nao renderiza botao de voltar para ADMIN, GESTOR ou SUPORTE', () => {
    const { rerender } = render(<DashboardTopBar {...base} user={{ name: 'Admin', role: 'ADMIN' }} title="Relatórios" />);
    expect(screen.queryByTestId('header-back-button')).toBeNull();

    rerender(<DashboardTopBar {...base} user={{ name: 'Gestor', role: 'GESTOR' }} title="Relatórios" />);
    expect(screen.queryByTestId('header-back-button')).toBeNull();

    rerender(<DashboardTopBar {...base} user={{ name: 'Suporte', role: 'SUPORTE' }} title="Relatórios" />);
    expect(screen.queryByTestId('header-back-button')).toBeNull();
  });
});

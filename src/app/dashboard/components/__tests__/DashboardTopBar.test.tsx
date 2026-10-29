/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { DashboardTopBar } from '../DashboardTopBar';

describe('DashboardTopBar', () => {
  it('exibe o primeiro nome do usuário autenticado no header', () => {
    render(
      <DashboardTopBar
        menuOpen={false}
        setMenuOpen={jest.fn()}
        user={{ name: 'Guilherme Igeski Stencel', role: 'ANNOTATOR' }}
        onNewMatch={jest.fn()}
        onLogout={jest.fn()}
      />
    );

    // Deve exibir apenas o primeiro nome
    expect(screen.getByText('Guilherme')).toBeInTheDocument();
    expect(screen.queryByText('Guilherme Igeski Stencel')).not.toBeInTheDocument();
    expect(screen.queryByText('Usuário')).not.toBeInTheDocument();
  });

  it('exibe o primeiro nome para Administrador do Sistema', () => {
    render(
      <DashboardTopBar
        menuOpen={false}
        setMenuOpen={jest.fn()}
        user={{ name: 'Administrador do Sistema', role: 'ADMIN' }}
        onNewMatch={jest.fn()}
        onLogout={jest.fn()}
      />
    );

    expect(screen.getByText('Administrador')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  const base = { menuOpen: false, setMenuOpen: jest.fn(), user: { name: 'Eduardo', role: 'ANNOTATOR' }, onNewMatch: jest.fn(), onLogout: jest.fn() };

  it('mostra o menu hambúrguer por padrão', () => {
    render(<DashboardTopBar {...base} />);
    expect(screen.getByTestId('hamburger-menu-button')).toBeInTheDocument();
  });

  it('esconde o hambúrguer com showMenuButton=false e mantém título, Nova Partida e Sair', () => {
    render(<DashboardTopBar {...base} title="Painel do Gestor" showMenuButton={false} />);
    expect(screen.queryByTestId('hamburger-menu-button')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Abrir menu')).not.toBeInTheDocument();
    expect(screen.getByText('Painel do Gestor')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Nova partida' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sair' })).toBeInTheDocument();
  });
});

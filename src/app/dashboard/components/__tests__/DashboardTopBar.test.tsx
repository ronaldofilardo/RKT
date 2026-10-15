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
});

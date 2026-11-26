/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { DashboardSidebar } from '../DashboardSidebar';

jest.mock('@/components/ThemeToggle', () => ({ ThemeToggle: () => <div data-testid="theme-toggle" /> }));

describe('DashboardSidebar - seletor de contexto', () => {
  const contexts = [
    { id: 'ct1', label: 'Clube Alpha', role: 'TREINADOR', type: 'CLUB' as const },
    { id: 'PARTICULAR', label: 'Atuação Particular', role: 'TREINADOR_AVULSO', type: 'PARTICULAR' as const },
  ];

  it('exibe o seletor de contexto dentro do menu lateral quando há múltiplos contextos', () => {
    render(
      <DashboardSidebar
        menuOpen={true}
        setMenuOpen={jest.fn()}
        sections={[]}
        activeContextId="ct1"
        availableContexts={contexts}
      />,
    );
    expect(screen.getByText('Contexto ativo')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Trocar clube ou contexto' })).toHaveTextContent('Clube Alpha');
  });

  it('omite o bloco de contexto quando não há contextos disponíveis', () => {
    render(<DashboardSidebar menuOpen={true} setMenuOpen={jest.fn()} sections={[]} />);
    expect(screen.queryByText('Contexto ativo')).toBeNull();
  });
});

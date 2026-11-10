/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { DashboardHomeSection } from '../dashboard-home-section';

describe('Characterization — DashboardHomeSection baseline', () => {
  it('renderiza saudação e atalhos sem badges ou mural', () => {
    const navigateToTarget = jest.fn();
    const { container } = render(
      <DashboardHomeSection
        userName="Silva"
        activeArea="TREINADOR_CLUBE"
        navigateToTarget={navigateToTarget}
      />
    );

    expect(screen.getByText(/Silva/)).toBeInTheDocument();
    expect(screen.getByText('Nova Partida')).toBeInTheDocument();
    expect(screen.getByText('Meus Atletas')).toBeInTheDocument();

    // Baseline: nenhum badge ou card de aviso/mural renderizado
    expect(container.querySelector('[data-testid="notif-badge"]')).toBeNull();
    expect(screen.queryByText(/VOCÊ FOI DESIGNADO/i)).toBeNull();
  });
});

/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { DashboardHomeSection } from '../dashboard-home-section';

const mockUseNotificationCount = jest.fn();
jest.mock('@/hooks/useNotificationCount', () => ({
  useNotificationCount: () => mockUseNotificationCount(),
}));

jest.mock('@/components/dashboard/assigned-notif-section', () => ({
  AssignedNotifSection: () => <div data-testid="mock-mural-treinador">Mural do Treinador</div>,
}));

describe('DashboardHomeSection — Badges e Mural', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) }) as any;
  });

  it('exibe badges de notificação e mural para TREINADOR_CLUBE', () => {
    mockUseNotificationCount.mockReturnValue({
      poolWithAthlete: 3,
      poolAvailable: 8,
      assigned: 1,
      isLoading: false,
    });

    render(
      <DashboardHomeSection
        userName="Treinador Carlos"
        activeArea="TREINADOR_CLUBE"
        navigateToTarget={jest.fn()}
      />
    );

    expect(screen.getByTestId('mock-mural-treinador')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
  });

  it('não renderiza o mural do treinador para ATLETA', () => {
    mockUseNotificationCount.mockReturnValue({
      poolWithAthlete: 0,
      poolAvailable: 0,
      assigned: 0,
      isLoading: false,
    });

    render(
      <DashboardHomeSection
        userName="Atleta Lucas"
        activeArea="ATLETA"
        navigateToTarget={jest.fn()}
      />
    );

    expect(screen.queryByTestId('mock-mural-treinador')).toBeNull();
  });
});


/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { AssignedNotifSection } from '../assigned-notif-section';

const mockUseAssigned = jest.fn();
jest.mock('@/hooks/useAssignedNotifications', () => ({
  useAssignedNotifications: () => mockUseAssigned(),
}));
jest.mock('@/components/Toast', () => ({
  useToast: () => ({ toast: jest.fn() }),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

describe('AssignedNotifSection', () => {
  it('retorna null quando a lista de notificações estiver vazia', () => {
    mockUseAssigned.mockReturnValue({
      notifications: [],
      isLoading: false,
      markAsRead: jest.fn(),
    });

    const { container } = render(<AssignedNotifSection />);
    expect(container.firstChild).toBeNull();
  });

  it('renderiza skeleton quando estiver carregando', () => {
    mockUseAssigned.mockReturnValue({
      notifications: [],
      isLoading: true,
      markAsRead: jest.fn(),
    });

    const { container } = render(<AssignedNotifSection />);
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renderiza os cards de notificação quando houver itens', () => {
    mockUseAssigned.mockReturnValue({
      notifications: [
        {
          id: 'n1',
          payload: {
            matchId: 'm1',
            templateId: 't1',
            player1Name: 'P1',
            player2Name: 'P2',
            assignedByName: 'Gestor',
          },
          createdAt: new Date(),
        },
      ],
      isLoading: false,
      markAsRead: jest.fn(),
    });

    render(<AssignedNotifSection />);
    expect(screen.getByText(/Avisos de Designação/i)).toBeInTheDocument();
    expect(screen.getByText('P1 × P2')).toBeInTheDocument();
  });
});


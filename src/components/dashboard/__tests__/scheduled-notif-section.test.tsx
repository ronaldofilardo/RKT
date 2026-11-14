/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ScheduledNotifSection } from '../scheduled-notif-section';
import { useScheduledNotifications } from '@/hooks/useScheduledNotifications';

jest.mock('@/hooks/useScheduledNotifications');
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('@/components/Toast', () => ({ useToast: () => ({ toast: jest.fn() }) }));

const mockUseScheduledNotifications = useScheduledNotifications as jest.MockedFunction<typeof useScheduledNotifications>;

describe('ScheduledNotifSection', () => {
  it('renderiza nada quando lista está vazia', () => {
    mockUseScheduledNotifications.mockReturnValue({
      notifications: [], isLoading: false, markAsRead: jest.fn(), refresh: jest.fn(),
    });
    const { container } = render(<ScheduledNotifSection />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renderiza os cards de partidas agendadas com informações e botões', () => {
    const markAsReadMock = jest.fn();
    mockUseScheduledNotifications.mockReturnValue({
      notifications: [
        {
          id: 'notif-1',
          payload: {
            matchId: 'm1', templateId: 'tpl1', player1Name: 'Carlos Silva',
            player2Name: 'João Santos', createdByName: 'Treinador Bernardo',
            scheduledAt: '2026-11-20T14:30:00.000Z',
          },
          createdAt: new Date(),
        },
      ],
      isLoading: false, markAsRead: markAsReadMock, refresh: jest.fn(),
    });

    render(<ScheduledNotifSection />);
    expect(screen.getByText(/Partidas Criadas por Outros Usuários \(1\)/i)).toBeInTheDocument();
    expect(screen.getByText('Carlos Silva × João Santos')).toBeInTheDocument();
    expect(screen.getByText(/Treinador Bernardo/)).toBeInTheDocument();

    const dismissBtn = screen.getByRole('button', { name: /Dispensar/i });
    fireEvent.click(dismissBtn);
    expect(markAsReadMock).toHaveBeenCalledWith('notif-1');
  });

  it('elimina repetições da mesma partida na renderização', () => {
    mockUseScheduledNotifications.mockReturnValue({
      notifications: [
        {
          id: 'notif-1',
          payload: { matchId: 'm1', player1Name: 'Juca Balas', player2Name: 'SonMy', scheduledAt: '2026-11-19T15:45:00.000Z' },
          createdAt: new Date(),
        },
        {
          id: 'notif-2',
          payload: { matchId: 'm2', player1Name: 'SonMy', player2Name: 'Juca Balas', scheduledAt: '2026-11-19T15:45:00.000Z' },
          createdAt: new Date(),
        },
      ],
      isLoading: false, markAsRead: jest.fn(), refresh: jest.fn(),
    });

    render(<ScheduledNotifSection />);
    expect(screen.getByText(/Partidas Criadas por Outros Usuários \(1\)/i)).toBeInTheDocument();
    expect(screen.getAllByText('Juca Balas × SonMy')).toHaveLength(1);
  });
});

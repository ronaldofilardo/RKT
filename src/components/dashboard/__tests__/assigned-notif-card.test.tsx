/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { AssignedNotifCard } from '../assigned-notif-card';

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

describe('AssignedNotifCard', () => {
  const notif = {
    id: 'notif-1',
    payload: {
      matchId: 'm-1',
      templateId: 'tpl-1',
      player1Name: 'Carlos Souza',
      player2Name: 'Rafael Lima',
      assignedByName: 'João Gestor',
      scheduledAt: '2026-11-10T14:00:00Z',
    },
    createdAt: '2026-11-10T10:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renderiza os dados da partida e quem atribuiu', () => {
    const onDismiss = jest.fn();
    render(<AssignedNotifCard notification={notif} onDismiss={onDismiss} />);

    expect(screen.getByText(/VOCÊ FOI DESIGNADO/i)).toBeInTheDocument();
    expect(screen.getByText('Carlos Souza × Rafael Lima')).toBeInTheDocument();
    expect(screen.getByText('João Gestor')).toBeInTheDocument();
  });

  it('clique em "Dispensar" chama onDismiss sem redirecionar', () => {
    const onDismiss = jest.fn();
    render(<AssignedNotifCard notification={notif} onDismiss={onDismiss} />);

    fireEvent.click(screen.getByRole('button', { name: 'Dispensar' }));
    expect(onDismiss).toHaveBeenCalledWith('notif-1');
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('clique em "Ver Partida" chama onDismiss e redireciona', () => {
    const onDismiss = jest.fn();
    render(<AssignedNotifCard notification={notif} onDismiss={onDismiss} />);

    fireEvent.click(screen.getByRole('button', { name: 'Ver Partida' }));
    expect(onDismiss).toHaveBeenCalledWith('notif-1');
    expect(mockPush).toHaveBeenCalledWith('/partidas-publicas?templateId=tpl-1');
  });
});


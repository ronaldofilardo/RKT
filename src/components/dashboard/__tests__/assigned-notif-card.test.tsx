/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AssignedNotifCard } from '../assigned-notif-card';

const mockPush = jest.fn();
const mockToast = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));
jest.mock('@/components/Toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

describe('AssignedNotifCard', () => {
  const notif = {
    id: 'notif-1',
    payload: {
      matchId: 'tpl-1',
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
    mockPush.mockClear();
    mockToast.mockClear();
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

  it('clique em "Ver Partida" não descarta o aviso, cria a anotação e redireciona para o scoring', async () => {
    const onDismiss = jest.fn();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ matchId: 'match-derivado-1' }),
    }) as any;

    render(<AssignedNotifCard notification={notif} onDismiss={onDismiss} />);

    fireEvent.click(screen.getByRole('button', { name: 'Ver Partida' }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/match/match-derivado-1/scoring');
    });

    expect(onDismiss).not.toHaveBeenCalled();
    expect(global.fetch).toHaveBeenCalledWith('/api/matches/pool/tpl-1/annotate', { method: 'POST' });
  });

  it('quando já há anotação (409), redireciona para o scoring da anotação existente sem descartar', async () => {
    const onDismiss = jest.fn();
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ details: { matchId: 'match-existente-9' } }),
    }) as any;

    render(<AssignedNotifCard notification={notif} onDismiss={onDismiss} />);

    fireEvent.click(screen.getByRole('button', { name: 'Ver Partida' }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/match/match-existente-9/scoring');
    });

    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('em erro na anotação, não redireciona e não descarta o aviso', async () => {
    const onDismiss = jest.fn();
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ message: 'erro interno' }),
    }) as any;

    render(<AssignedNotifCard notification={notif} onDismiss={onDismiss} />);

    fireEvent.click(screen.getByRole('button', { name: 'Ver Partida' }));

    await waitFor(() => {
      expect(mockPush).not.toHaveBeenCalled();
    });

    expect(onDismiss).not.toHaveBeenCalled();
    expect(mockToast).toHaveBeenCalled();
  });
});

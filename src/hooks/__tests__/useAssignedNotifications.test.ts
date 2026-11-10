/**
 * @jest-environment jsdom
 */
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAssignedNotifications } from '../useAssignedNotifications';

describe('useAssignedNotifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('carrega notificações atribuídas no mount e remove otimisticamente via markAsRead', async () => {
    const mockData = [
      {
        id: 'notif-1',
        payload: {
          matchId: 'm1',
          templateId: 'm1',
          player1Name: 'Player 1',
          player2Name: 'Player 2',
          assignedByName: 'Gestor',
        },
        createdAt: '2026-11-10T10:00:00Z',
      },
    ];

    global.fetch = jest.fn().mockImplementation((url: string, opts?: any) => {
      if (url.includes('/read')) {
        return Promise.resolve({ ok: true, json: async () => ({ id: 'notif-1' }) });
      }
      return Promise.resolve({ ok: true, json: async () => mockData });
    }) as any;

    const { result } = renderHook(() => useAssignedNotifications());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.notifications).toHaveLength(1);

    await act(async () => {
      await result.current.markAsRead('notif-1');
    });

    expect(result.current.notifications).toHaveLength(0);
    expect(global.fetch).toHaveBeenCalledWith('/api/notifications/notif-1/read', { method: 'PATCH' });
  });
});


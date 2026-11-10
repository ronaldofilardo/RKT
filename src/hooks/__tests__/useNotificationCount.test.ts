/**
 * @jest-environment jsdom
 */
import { renderHook, act, waitFor } from '@testing-library/react';
import { useNotificationCount } from '../useNotificationCount';

describe('useNotificationCount', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('carrega contagens de notificações no mount', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        pool_with_athlete: 2,
        pool_available: 7,
        assigned: 1,
      }),
    }) as any;

    const { result } = renderHook(() => useNotificationCount());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.poolWithAthlete).toBe(2);
    expect(result.current.poolAvailable).toBe(7);
    expect(result.current.assigned).toBe(1);
  });

  it('retorna zeros se a requisição falhar', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error')) as any;

    const { result } = renderHook(() => useNotificationCount());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.poolWithAthlete).toBe(0);
    expect(result.current.poolAvailable).toBe(0);
    expect(result.current.assigned).toBe(0);
  });
});


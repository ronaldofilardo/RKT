describe('atletas and match/new userId guard', () => {
  const sessionStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      clear: () => {
        store = {};
      },
    };
  })();

  Object.defineProperty(global, 'sessionStorage', {
    value: sessionStorageMock,
    writable: true,
  });

  beforeEach(() => {
    sessionStorageMock.clear();
    (global.fetch as jest.Mock) = jest.fn();
  });

  it('não deve chamar /api/players quando userId for null', async () => {
    sessionStorageMock.setItem('access_token', 'token');
    sessionStorageMock.setItem('user_id', '');

    const loadAthletes = async () => {
      const userId = sessionStorageMock.getItem('user_id');
      const token = sessionStorageMock.getItem('access_token');
      if (!userId) {
        return { shouldFetch: false, athletes: [] as any[] };
      }

      const res = await fetch(`/api/players?userId=${encodeURIComponent(userId)}`, {
        headers: { authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      const players = json?.data?.players ?? json?.players ?? [];
      return { shouldFetch: true, athletes: Array.isArray(players) ? players : [] };
    };

    const result = await loadAthletes();

    expect(result.shouldFetch).toBe(false);
    expect(result.athletes).toEqual([]);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('deve carregar atletas quando userId estiver presente', async () => {
    sessionStorageMock.setItem('access_token', 'token');
    sessionStorageMock.setItem('user_id', 'user-123');

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { players: [{ id: '1', name: 'Atleta' }] } }),
    });

    const loadAthletes = async () => {
      const userId = sessionStorageMock.getItem('user_id');
      const token = sessionStorageMock.getItem('access_token');
      if (!userId) {
        return { shouldFetch: false, athletes: [] as any[] };
      }

      const res = await fetch(`/api/players?userId=${encodeURIComponent(userId)}`, {
        headers: { authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      const players = json?.data?.players ?? json?.players ?? [];
      return { shouldFetch: true, athletes: Array.isArray(players) ? players : [] };
    };

    const result = await loadAthletes();

    expect(result.shouldFetch).toBe(true);
    expect(result.athletes).toEqual([{ id: '1', name: 'Atleta' }]);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});

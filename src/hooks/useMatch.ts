'use client';

import { useState, useEffect, useCallback } from 'react';

export function useMatch(matchId: string) {
  const [match, setMatch] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMatch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = sessionStorage.getItem('access_token');
      const res = await fetch(`/api/matches/${matchId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error('Falha ao carregar partida');
      const data = await res.json();
      setMatch(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    fetchMatch();
  }, [fetchMatch]);

  return { match, isLoading, error, refetch: fetchMatch };
}

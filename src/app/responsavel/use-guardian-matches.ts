'use client';

import { useState, useEffect, useCallback } from 'react';
import type { GuardianDependentMatchItem } from '@/app/api/guardians/me/matches/matches-read.logic';

export function useGuardianMatches() {
  const [matches, setMatches] = useState<GuardianDependentMatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMatches = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/guardians/me/matches');
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Falha ao carregar partidas.');
      setMatches(data.matches || []);
    } catch (err: any) {
      setError(err.message || 'Erro inesperado.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  return { matches, loading, error, refetch: fetchMatches };
}

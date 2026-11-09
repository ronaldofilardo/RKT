'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  filterPoolMatches,
  type PublicPoolMatch,
} from './public-match-pool.logic';

export type { PublicPoolMatch } from './public-match-pool.logic';

interface PoolResponse {
  data?: { matches?: PublicPoolMatch[]; nextCursor?: string | null };
  message?: string;
}

export function usePublicMatchPool() {
  const [matches, setMatches] = useState<PublicPoolMatch[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const load = useCallback(async (nextCursor?: string | null, append = false) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: '20' });
      if (nextCursor) params.set('cursor', nextCursor);
      const res = await fetch(`/api/matches/pool?${params.toString()}`);
      const json = (await res.json()) as PoolResponse;
      if (!res.ok) throw new Error(json.message ?? 'Erro ao carregar partidas públicas');
      const incoming = json.data?.matches ?? [];
      setMatches((prev) => (append ? [...prev, ...incoming] : incoming));
      setCursor(json.data?.nextCursor ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar partidas públicas');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const loadMore = useCallback(() => {
    if (cursor && !loadingMore) void load(cursor, true);
  }, [cursor, loadingMore, load]);

  const reload = useCallback(() => load(), [load]);

  const filtered = useMemo(() => filterPoolMatches(matches, search), [matches, search]);

  return {
    matches: filtered,
    total: matches.length,
    loading,
    loadingMore,
    error,
    hasMore: Boolean(cursor),
    search,
    setSearch,
    loadMore,
    reload,
  };
}

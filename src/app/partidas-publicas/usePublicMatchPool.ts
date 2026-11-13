'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { filterPoolMatches, type PublicPoolMatch } from './public-match-pool.logic';

export type { PublicPoolMatch } from './public-match-pool.logic';
export type PoolTabScope = 'public' | 'private';

interface PoolResponse {
  data?: { matches?: PublicPoolMatch[]; nextCursor?: string | null };
  message?: string;
}

export function usePublicMatchPool(scope: PoolTabScope = 'public') {
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
      const endpoint = scope === 'private'
        ? '/api/matches/available?scope=private&limit=30'
        : `/api/matches/pool?${new URLSearchParams({ limit: '20', ...(nextCursor ? { cursor: nextCursor } : {}) }).toString()}`;
      const res = await fetch(endpoint);
      const json = (await res.json()) as PoolResponse;
      if (!res.ok) throw new Error(json.message ?? 'Erro ao carregar partidas');
      const incoming = json.data?.matches ?? [];
      setMatches((prev) => (append ? [...prev, ...incoming] : incoming));
      setCursor(scope === 'public' ? (json.data?.nextCursor ?? null) : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar partidas');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [scope]);

  useEffect(() => {
    void load();
  }, [load]);

  const loadMore = useCallback(() => {
    if (cursor && !loadingMore && scope === 'public') void load(cursor, true);
  }, [cursor, loadingMore, load, scope]);

  const reload = useCallback(() => load(), [load]);
  const filtered = useMemo(() => filterPoolMatches(matches, search), [matches, search]);

  return {
    matches: filtered, total: matches.length, loading, loadingMore, error,
    hasMore: Boolean(cursor) && scope === 'public', search, setSearch, loadMore, reload,
  };
}

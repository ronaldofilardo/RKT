import { useCallback, useEffect, useRef, useState } from 'react';
import { logger } from '@/lib/logger';
import { flushPendingAbandons } from '@/hooks/useSessionManager.pending-abandon';
import type { DashboardMatchPayload } from '@/components/dashboard/MatchCard';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { checkAuthAndGetToken, fetchMatchesEndpoint } from './use-dashboard-matches-fetch';
import { EMPTY_MATCH_PAGE, buildMatchesUrl, reducePage, type MatchPage } from './dashboard-matches-page.logic';

type MatchPages = Record<string, MatchPage>;

/** Cache paginado de `/api/matches` por aba (`stateKey`), com refresh e "Carregar mais". */
export function useMatchPages(stateKey: string, router?: AppRouterInstance | null) {
  const [pages, setPages] = useState<MatchPages>({});
  const [suspendedFromApi, setSuspendedFromApi] = useState<DashboardMatchPayload[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);
  const routerRef = useRef(router ?? null);
  routerRef.current = router ?? null;
  const pagesRef = useRef(pages);
  pagesRef.current = pages;
  const loadedKeysRef = useRef<Set<string>>(new Set());
  const suspendedDoneRef = useRef(false);
  const authDoneRef = useRef(false);
  const loadingMoreRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  const loadPage = useCallback(
    async (key: string, o: { cursor?: string | null; append?: boolean; controller?: AbortController } = {}) => {
      const result = await fetchMatchesEndpoint(buildMatchesUrl(key, o.cursor), routerRef.current, o.controller);
      setPages((prev) => {
        const next = reducePage(prev[key], result, Boolean(o.append), Boolean(o.controller?.signal.aborted));
        return next ? { ...prev, [key]: next } : prev;
      });
    },
    [],
  );

  useEffect(() => {
    const loadedKeys = loadedKeysRef.current;
    if (loadedKeys.has(stateKey)) return;
    loadedKeys.add(stateKey);
    const controller = new AbortController();
    abortRef.current = controller;
    void (async () => {
      // Guarda de sessão uma única vez, antes de qualquer busca.
      const isAuthOk = await checkAuthAndGetToken(routerRef.current);
      if (!isAuthOk) {
        setPages((prev) => ({ ...prev, [stateKey]: { ...EMPTY_MATCH_PAGE, loaded: true } }));
        return;
      }
      if (!authDoneRef.current) {
        authDoneRef.current = true;
        flushPendingAbandons().catch((e) => logger.warn('[fetchDashboardData] flushPendingAbandons falhou:', e));
      }
      await loadPage(stateKey, { controller });
      if (controller.signal.aborted || suspendedDoneRef.current) return;
      // Falha em suspended-sessions nunca apaga a lista principal.
      suspendedDoneRef.current = true;
      const suspended = await fetchMatchesEndpoint('/api/matches/suspended-sessions', routerRef.current, controller);
      if (suspended.ok) setSuspendedFromApi(suspended.matches);
      else if (!controller.signal.aborted) logger.warn('[fetchDashboardData] suspended-sessions falhou:', suspended.errorMessage);
    })();
    return () => {
      controller.abort();
      if (!pagesRef.current[stateKey]?.loaded) loadedKeys.delete(stateKey);
    };
  }, [stateKey, refreshTick, loadPage]);

  const refresh = useCallback(() => {
    abortRef.current?.abort();
    loadedKeysRef.current.delete(stateKey);
    setRefreshTick((tick) => tick + 1);
  }, [stateKey]);

  const loadMore = useCallback(async () => {
    const current = pagesRef.current[stateKey];
    if (!current?.loaded || !current.nextCursor || loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      await loadPage(stateKey, { cursor: current.nextCursor, append: true });
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [stateKey, loadPage]);

  return {
    page: pages[stateKey] ?? EMPTY_MATCH_PAGE,
    suspendedFromApi,
    loadingMore,
    refresh,
    loadMore,
  };
}

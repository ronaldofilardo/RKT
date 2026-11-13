import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import type { DashboardPageView } from "../dashboard-view.logic";
import { useDashboardMatchFilters } from "./use-dashboard-matches-filters";
import { stateKeyForView } from "./dashboard-matches-page.logic";
import { useMatchPages } from "./use-dashboard-matches-pages";

/**
 * Dados do dashboard: cache de página por aba (`stateKey`) para não rebuscar ao
 * alternar entre subvisões, falha isolada de `/api/matches/suspended-sessions`,
 * paginação (`nextCursor` + "Carregar mais") e erro explícito de carga.
 *
 * `loading` é derivado de `!page.loaded`, então nunca se exibe estado vazio
 * antes da primeira resposta (nem durante a troca de aba).
 */
export function useDashboardData(router?: AppRouterInstance, view?: DashboardPageView) {
  const { page, suspendedFromApi, loadingMore, refresh, loadMore } = useMatchPages(
    stateKeyForView(view),
    router,
  );

  return {
    matches: page.matches,
    suspendedFromApi,
    loading: !page.loaded,
    errorMessage: page.errorMessage,
    nextCursor: page.nextCursor,
    loadingMore,
    fetchDashboardData: refresh,
    loadMore,
  };
}

export { useDashboardMatchFilters };

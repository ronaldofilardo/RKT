import type { DashboardMatchPayload } from '@/components/dashboard/MatchCard';
import type { DashboardPageView } from '../dashboard-view.logic';
import type { FetchMatchesResult } from './use-dashboard-matches-fetch';

/** Limite por página do dashboard (abaixo do MAX de 100 da API). */
export const MATCH_PAGE_LIMIT = 50;

/**
 * Página carregada de `/api/matches` para um `stateKey`.
 * `loaded === false` significa "ainda não buscada" (=> estado de carregamento).
 */
export interface MatchPage {
  matches: DashboardMatchPayload[];
  nextCursor: string | null;
  errorMessage: string | null;
  loaded: boolean;
}

export const EMPTY_MATCH_PAGE: MatchPage = {
  matches: [],
  nextCursor: null,
  errorMessage: null,
  loaded: false,
};

/** `state` do servidor por subvisão; `''` = lista completa (sem filtro de estado). */
const STATE_BY_VIEW: Partial<Record<DashboardPageView, string>> = {
  annotated: 'FINISHED',
  reports: 'FINISHED',
  live: 'IN_PROGRESS',
  pending: 'SCHEDULED',
};

export function stateKeyForView(view?: DashboardPageView | null): string {
  return (view && STATE_BY_VIEW[view]) || '';
}

export function buildMatchesUrl(stateKey: string, cursor?: string | null): string {
  const params = new URLSearchParams({ limit: String(MATCH_PAGE_LIMIT) });
  if (stateKey) params.set('state', stateKey);
  if (cursor) params.set('cursor', cursor);
  return `/api/matches?${params.toString()}`;
}

/** Página marcada como "já tentada" com falha: encerra o carregamento e expõe o erro. */
export function failurePage(errorMessage: string): MatchPage {
  return { matches: [], nextCursor: null, errorMessage, loaded: true };
}

/**
 * Mescla uma página nova preservando o conteúdo já carregado em "Carregar mais".
 * Duplicatas (mesmo `id`) são descartadas.
 */
export function appendPage(
  current: MatchPage,
  incoming: DashboardMatchPayload[],
  nextCursor: string | null,
): MatchPage {
  const known = new Set(current.matches.map((m) => m.id));
  const merged = [...current.matches, ...incoming.filter((m) => !known.has(m.id))];
  return { matches: merged, nextCursor, errorMessage: null, loaded: true };
}

/**
 * Reduz o resultado de uma busca para a próxima página.
 * Retorna `null` quando a requisição foi cancelada pelo cliente — nesse caso o
 * estado da página não muda (evita apagar dados por unmount/troca de aba).
 */
export function reducePage(
  current: MatchPage | undefined,
  result: FetchMatchesResult,
  append: boolean,
  cancelled: boolean,
): MatchPage | null {
  if (cancelled) return null;
  if (!result.ok) {
    return current?.loaded
      ? { ...current, errorMessage: result.errorMessage }
      : failurePage(result.errorMessage);
  }
  const base = current ?? EMPTY_MATCH_PAGE;
  return append
    ? appendPage(base, result.matches, result.nextCursor)
    : { matches: result.matches, nextCursor: result.nextCursor, errorMessage: null, loaded: true };
}

import { AREA_PREFIXES } from '@/core/access/areas';

export type DashboardPageView = 'dashboard' | 'annotated' | 'live' | 'pending' | 'history' | 'reports';

export const VIEW_TITLES: Record<DashboardPageView, string> = {
  dashboard: 'Início',
  history: 'Minhas Partidas',
  reports: 'Relatórios',
  annotated: 'Partidas Anotadas',
  live: 'Partidas Ao Vivo',
  pending: 'Partidas Aguardando',
};

/**
 * Normaliza o pathname removendo qualquer prefixo de área conhecido
 * (ex: /clube/treinador/historico -> /historico, /atleta/relatorios -> /relatorios).
 */
export function normalizeDashboardPath(pathname: string | null): string {
  if (!pathname) return '/';
  for (const prefix of Object.values(AREA_PREFIXES)) {
    if (pathname === prefix) {
      return '/dashboard';
    }
    if (pathname.startsWith(`${prefix}/`)) {
      return pathname.slice(prefix.length);
    }
  }
  return pathname;
}

/**
 * Deriva a view ativa do dashboard a partir do pathname,
 * suportando rotas legadas e rotas com prefixo de área.
 */
export function resolveDashboardView(pathname: string | null): DashboardPageView {
  const norm = normalizeDashboardPath(pathname);
  if (norm.startsWith('/partidasanotadas')) return 'annotated';
  if (norm.startsWith('/partidasaovivo')) return 'live';
  if (norm.startsWith('/aguardandoanotador')) return 'pending';
  if (norm.startsWith('/historico')) return 'history';
  if (norm.startsWith('/relatorios')) return 'reports';
  return 'dashboard';
}

import type { DashboardMatchPayload } from '@/components/dashboard/MatchCard';
import type { DashboardView } from '../dashboard.types';

export type { DashboardView };

export interface DashboardViewRouterProps {
  view: DashboardView;
  loading: boolean;
  ctId?: string | null;
  ctName?: string | null;
  userId?: string | null;
  /** Primeiro nome do usuário logado — usado na saudação da home. */
  userName?: string | null;
  followedPlayerIds?: readonly string[] | string[] | null;
  activeArea?: string | null;
  finishedMatches: DashboardMatchPayload[];
  liveMatches: DashboardMatchPayload[];
  pendingMatches: DashboardMatchPayload[];
  historyMatches: DashboardMatchPayload[];
  visibleMatches: DashboardMatchPayload[];
  suspendedFromApi: DashboardMatchPayload[];
  /** Mensagem de falha da carga da página atual (null/undefined = sem falha). */
  errorMessage?: string | null;
  /** Recarrega a página da subvisão ativa. */
  onRetry?: () => void;
  /** Cursor da próxima página (`null` = sem mais páginas). */
  nextCursor?: string | null;
  onLoadMore?: () => void;
  loadingMore?: boolean;
  navigateToTarget: (v: DashboardView) => void;
  openMatchDetails: (m: DashboardMatchPayload) => void;
  openMatchReport: (m: DashboardMatchPayload, tab?: string) => void;
  finishMatch: (m: DashboardMatchPayload) => void;
  deleteMatch: (m: DashboardMatchPayload) => void;
  openMatchEditScore?: (m: DashboardMatchPayload) => void;
  resumeMatch?: (m: DashboardMatchPayload) => void;
  openMatchSetSummary?: (m: DashboardMatchPayload) => void;
  openMatchEditInfo?: (m: DashboardMatchPayload) => void;
  onShareMatch?: (m: DashboardMatchPayload) => void;
}

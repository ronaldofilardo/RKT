import type { DashboardMatchPayload } from '@/components/dashboard/MatchCard';

export type DashboardView = 'dashboard' | 'annotated' | 'live' | 'pending' | 'history';

export interface DashboardViewRouterProps {
  view: DashboardView;
  loading: boolean;
  finishedMatches: DashboardMatchPayload[];
  liveMatches: DashboardMatchPayload[];
  pendingMatches: DashboardMatchPayload[];
  historyMatches: DashboardMatchPayload[];
  visibleMatches: DashboardMatchPayload[];
  suspendedFromApi: DashboardMatchPayload[];
  navigateToTarget: (v: DashboardView) => void;
  openMatchDetails: (m: DashboardMatchPayload) => void;
  openMatchReport: (m: DashboardMatchPayload) => void;
  finishMatch: (m: DashboardMatchPayload) => void;
  deleteMatch: (m: DashboardMatchPayload) => void;
  openMatchEditScore?: (m: DashboardMatchPayload) => void;
  resumeMatch?: (m: DashboardMatchPayload) => void;
  openMatchSetSummary?: (m: DashboardMatchPayload) => void;
  openMatchEditInfo?: (m: DashboardMatchPayload) => void;
}

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
  handleNavigate: (v: DashboardView) => void;
  handleMatchClick: (m: DashboardMatchPayload) => void;
  handleMatchReport: (m: DashboardMatchPayload) => void;
  handleMatchFinish: (m: DashboardMatchPayload) => void;
  handleMatchDelete: (m: DashboardMatchPayload) => void;
  handleMatchEditScore?: (m: DashboardMatchPayload) => void;
  handleMatchResume?: (m: DashboardMatchPayload) => void;
  handleMatchSetSummary?: (m: DashboardMatchPayload) => void;
  handleMatchEditInfo?: (m: DashboardMatchPayload) => void;
}

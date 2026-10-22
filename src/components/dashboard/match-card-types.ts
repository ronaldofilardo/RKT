export interface DashboardMatchPayload {
  id: string;
  state: string;
  format: string;
  matchType?: string;
  courtType?: string | null;
  player1: { name: string; id?: string };
  player2: { name: string; id?: string };
  player1Partner?: { name: string; id?: string } | null;
  player2Partner?: { name: string; id?: string } | null;
  doublesSetup?: unknown;
  scheduledAt?: string | null;
  scoreState?: unknown;
  scoreSummary?: unknown;
  suspendedSessionId?: string;
  matchStateSnapshot?: string | null;
  initialServerId?: string | null;
  finishReason?: string | null;
  status?: string | null;
  tournamentName?: string | null;
  category?: string | null;
  round?: string | null;
  bracketType?: string | null;
  temperature?: number | null;
  humidity?: number | null;
  visibility?: string | null;
  details?: string | null;
  clubName?: string | null;
  version?: number;
}

export interface MatchCardProps {
  match: DashboardMatchPayload;
  onClick?: (match: DashboardMatchPayload) => void;
  onReport?: (match: DashboardMatchPayload) => void;
  onFinish?: (match: DashboardMatchPayload) => void;
  onDelete?: (match: DashboardMatchPayload) => void;
  onEditScore?: (match: DashboardMatchPayload) => void;
  onResumeMatch?: (match: DashboardMatchPayload) => void;
  onSetSummary?: (match: DashboardMatchPayload) => void;
  onEditInfo?: (match: DashboardMatchPayload) => void;
}

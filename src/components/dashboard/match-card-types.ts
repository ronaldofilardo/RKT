export interface DashboardMatchPayload {
  id: string;
  state: string;
  format: string;
  matchType?: string;
  courtType?: string | null;
  player1: { name: string; id?: string; club?: string | null };
  player2: { name: string; id?: string; club?: string | null };
  player1Partner?: { name: string; id?: string; club?: string | null } | null;
  player2Partner?: { name: string; id?: string; club?: string | null } | null;
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
  /** ID do CT ativo do usuario logado ("meu clube"). Usado para indicar se cada atleta eh do proprio clube ou de outro. */
  ctId?: string | null;
  onClick?: (match: DashboardMatchPayload) => void;
  onReport?: (match: DashboardMatchPayload) => void;
  onFinish?: (match: DashboardMatchPayload) => void;
  onDelete?: (match: DashboardMatchPayload) => void;
  onEditScore?: (match: DashboardMatchPayload) => void;
  onResumeMatch?: (match: DashboardMatchPayload) => void;
  onSetSummary?: (match: DashboardMatchPayload) => void;
  onEditInfo?: (match: DashboardMatchPayload) => void;
  onShare?: (match: DashboardMatchPayload) => void;
}

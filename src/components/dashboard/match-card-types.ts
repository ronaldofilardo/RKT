export interface MatchPlayerPayload {
  name: string;
  id?: string;
  club?: string | null;
  clubId?: string | null;
  createdByUserId?: string | null;
  createdByName?: string | null;
  playerCts?: { ctId: string }[] | null;
}

export interface DashboardMatchPayload {
  id: string;
  state: string;
  format: string;
  matchType?: string;
  courtType?: string | null;
  ctId?: string | null;
  player1: MatchPlayerPayload;
  player2: MatchPlayerPayload;
  player1Partner?: MatchPlayerPayload | null;
  player2Partner?: MatchPlayerPayload | null;
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
  /** Nome do CT ativo do usuario logado. */
  ctName?: string | null;
  /** ID do usuario logado (usado para treinador avulso identificar "meu atleta"). */
  userId?: string | null;
  /** IDs de atletas vinculados ao treinador. */
  followedPlayerIds?: readonly string[] | string[] | null;
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

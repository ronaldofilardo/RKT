import type { ScoringState } from "@/core/scoring/types";

export interface MatchData {
  id: string;
  format: string;
  matchType?: 'SINGLES' | 'DOUBLES';
  player1: { id: string; name: string; club?: string | null; state?: string | null };
  player2: { id: string; name: string; club?: string | null; state?: string | null };
  player1PartnerId?: string | null;
  player2PartnerId?: string | null;
  player1Partner?: { id: string; name: string } | null;
  player2Partner?: { id: string; name: string } | null;
  doublesSetup?: unknown;
  initialServerId: string | null;
  scoreState: ScoringState | null;
  state: string;
  sportType?: string;
  courtType?: string;
  startedAt?: string | Date | null;
  version?: number;
  _count?: { pointLog: number };
  recentWinnerIds?: string[];
  tournamentName?: string | null;
  category?: string | null;
  round?: number | null;
  createdByUserId?: string | null;
  canShare?: boolean;
}

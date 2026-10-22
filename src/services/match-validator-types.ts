import type { MatchFormat, MatchState } from "@/schemas/contracts";

export interface MatchData {
  format: MatchFormat;
  matchType?: "SINGLES" | "DOUBLES" | null;
  player1Id: string;
  player2Id: string;
  player1PartnerId?: string | null;
  player2PartnerId?: string | null;
  initialServerId?: string | null;
  scoreState?: unknown;
  state: MatchState;
  doublesSetup?: unknown;
}

export interface ValidationResult {
  error?: string;
  valid: boolean;
}

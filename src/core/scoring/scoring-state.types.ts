import type { PointType as ContractPointType, RallyDetails as ContractRallyDetails, MatchFormat as ContractMatchFormat } from '@/schemas/contracts';

export type TennisFormat = ContractMatchFormat;

export type Side = 'player1' | 'player2';

export interface DoublesArrangement {
  serveOrder: Record<Side, [string, string]>;
  serveIndex: Record<Side, 0 | 1>;
  receiveDeuce: Record<Side, string>;
}

export interface DoublesConfig {
  members: Record<Side, [string, string]>;
  initial: {
    serveOrder: Record<Side, [string, string]>;
    receiveDeuce: Record<Side, string>;
  };
}

export interface ScoringEngineConfig {
  format: TennisFormat;
  player1Id: string;
  player2Id: string;
  initialServerId: string;
  doubles?: DoublesConfig;
}

export interface GameScore {
  player1: number;
  player2: number;
  isDeuce: boolean;
  advantage: 'player1' | 'player2' | null;
  secondServe: boolean;
}

export interface SetScore {
  player1: number;
  player2: number;
  isTiebreak: boolean;
  tiebreakScore: { player1: number; player2: number } | null;
}

export interface PointDetails {
  winnerId: string;
  type: ContractPointType;
  isFirstServe: boolean;
  isSecondServe: boolean;
  serverId: string;
  timestamp: number;
  rallyDetails?: ContractRallyDetails | null;
  rallyLength?: number;
  firstFaultDetail?: { errorType?: string; serveEffect?: string; direction?: string } | null;
  receiverId?: string;
  courtSide?: 'deuce' | 'ad';
  hitterId?: string;
}

export interface HistoryEntry {
  stateBefore: ScoringState;
  point: PointDetails;
}

export interface ScoringState {
  sets: SetScore[];
  currentGame: GameScore;
  server: 'player1' | 'player2';
  isFinished: boolean;
  winner: 'player1' | 'player2' | null;
  setsWon: { player1: number; player2: number };
  startedAt: number | null;
  secondServe: boolean;
  doubles?: DoublesArrangement;
}

export interface PointFlow {
  winnerId: string;
  type: string;
  serverId: string;
  timestamp?: number;
  isFirstServe?: boolean;
  isSecondServe?: boolean;
  firstFault?: boolean;
  rallyDetails?: ContractRallyDetails | null;
  rallyLength?: number;
  firstFaultDetail?: { errorType?: string; serveEffect?: string; direction?: string } | null;
  clientEventId?: string;
  receiverId?: string;
  courtSide?: 'deuce' | 'ad';
  hitterId?: string;
}

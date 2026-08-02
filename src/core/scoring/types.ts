import type {
  PointType as ContractPointType,
  RallyDetails as ContractRallyDetails,
  RallySituacao as ContractRallySituacao,
  RallyTipo as ContractRallyTipo,
  RallyGolpe as ContractRallyGolpe,
  RallySubtipo1 as ContractRallySubtipo1,
  RallySubtipo2 as ContractRallySubtipo2,
  RallyEfeito as ContractRallyEfeito,
  RallyDirecao as ContractRallyDirecao,
  RallyGolpeEsp as ContractRallyGolpeEsp,
  RallyDuration as ContractRallyDuration,
  MatchFormat as ContractMatchFormat,
} from '@/schemas/contracts';

export type TennisFormat = ContractMatchFormat;

export type RallySituacao = ContractRallySituacao;
export type RallyTipo = ContractRallyTipo;
export type RallyGolpe = ContractRallyGolpe;
export type RallySubtipo1 = ContractRallySubtipo1;
export type RallySubtipo2 = ContractRallySubtipo2;
export type RallyEfeito = ContractRallyEfeito;
export type RallyDirecao = ContractRallyDirecao;
export type RallyGolpeEsp = ContractRallyGolpeEsp;
export type RallyDuration = ContractRallyDuration;

export type RallyDetails = ContractRallyDetails;

export interface ScoringEngineConfig {
  format: TennisFormat;
  player1Id: string;
  player2Id: string;
  initialServerId: string;
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
  isLet: boolean;
  serverId: string;
  timestamp: number;
  rallyDetails?: ContractRallyDetails | null;
  rallyLength?: number;
  firstFaultDetail?: { errorType?: string; serveEffect?: string; direction?: string } | null;
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
}

// Timeline types
export interface TimelinePoint {
  pointNumber: number;
  winner: 'PLAYER_1' | 'PLAYER_2';
  type: string;
  server: 'player1' | 'player2';
  isFirstServe: boolean;
  isSecondServe: boolean;
  gameScore: { player1: number; player2: number };
  gamesScore: { player1: number; player2: number };
  setNumber: number;
  isBreakPoint: boolean;
  isGameBall: boolean;
  isSetBall: boolean;
  rallyLength: number;
  rallyDetails: ContractRallyDetails | null;
  isTiebreak?: boolean;
  gameIsDeuce?: boolean;
  gameAdvantage?: 'player1' | 'player2' | null;
  serveEffect?: string;
  serveDirection?: string;
  firstFault?: { errorType?: string; serveEffect?: string; direction?: string } | null;
  pointDetails: PointDetails;
}



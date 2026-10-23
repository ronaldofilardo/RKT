import type { RallyDetails as ContractRallyDetails } from '@/schemas/contracts';
import type { PointDetails } from './scoring-state.types';

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
  note?: string;
  hasAudioNote?: boolean;
  audioNoteMime?: string;
  audioNoteDuration?: number;
  pointId?: string;
  sequenceNumber?: number;
  clientEventId?: string;
  recordedAt?: string;
  zone?: string;
  stroke?: string;
  rawAnnotations?: Record<string, unknown> | null;
  isTiebreak?: boolean;
  gameIsDeuce?: boolean;
  gameAdvantage?: 'player1' | 'player2' | null;
  serveEffect?: string;
  serveDirection?: string;
  firstFault?: { errorType?: string; serveEffect?: string; direction?: string } | null;
  firstServeOutcome?: 'ace' | 'out' | 'net' | null;
  secondServeOutcome?: 'ace' | 'out' | 'net' | null;
  pointDetails: PointDetails;
  serverId?: string;
  receiverId?: string;
  courtSide?: 'deuce' | 'ad';
  hitterId?: string;
  /**
   * Presente somente no primeiro ponto de um segmento de anotação que
   * começou após uma correção manual de placar (ex.: retomada de partida
   * interrompida). Usado pelo /report para renderizar um marcador de
   * "interrupção" entre os dois trechos da timeline, sem alterar as
   * colunas existentes da tabela.
   */
  segmentBreak?: {
    editedAt: string;
    editedByUserId?: string;
    note?: string;
    previousLabel: string;
    newLabel: string;
  };
}

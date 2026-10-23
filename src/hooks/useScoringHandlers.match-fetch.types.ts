import type { ScoringEngine } from '@/core/scoring/engine';
import type { HistoryEntry, RallyDetails, ScoringState } from '@/core/scoring/types';
import type { ScoreAction } from '@/hooks/useScoreReducer';
import type { MatchData } from './useScoringHandlers.types';

/** Envelope que o servidor pode devolver no `scoreState` (ver persistStateWithRetry). */
export type ScoreStateEnvelope = { state?: ScoringState; history?: HistoryEntry[] };

/**
 * Atributos de anotação persistidos no PointLog. Servidores legados podem
 * omitir os campos opcionais; por isso todos são `| null`/opcional.
 */
export type PointLogAnnotations = {
  firstFaultDetail?: { errorType?: string; serveEffect?: string; direction?: string } | null;
  rallyDetails?: RallyDetails | null;
  rallyLength?: number;
  isFirstServe?: boolean;
  isSecondServe?: boolean;
  note?: string;
  hitterId?: string | null;
  receiverId?: string | null;
  courtSide?: 'deuce' | 'ad' | null;
};

export interface ActiveLogSummary {
  id: string;
  winnerId: string;
  serverId: string;
  type: string;
  sequenceNumber?: number | null;
  annotations?: PointLogAnnotations | null;
  timestamp?: string | Date;
}

/** Campo defensivo: alguns servidores podem devolver além do schema atual. */
export type MatchDataWithSequence = MatchData & {
  lastPointSequence?: number;
  lastScoreEdit?: {
    id: string;
    editedAt: string | Date;
    newScoreState: unknown;
  } | null;
  activeLogsSinceEdit?: ActiveLogSummary[];
};

export interface MatchFetchDeps {
  matchId: string;
  tokenRef: React.MutableRefObject<string | null>;
  matchVersionRef: React.MutableRefObject<number | null>;
  pointSequenceRef: React.MutableRefObject<number>;
  engineRef: React.MutableRefObject<ScoringEngine | null>;
  openRef: React.MutableRefObject<
    (modal: string, params?: Record<string, string>) => void
  >;
  setMatch: (match: MatchData) => void;
  setScoreState: (action: ScoreAction) => void;
  setPointsHistory: React.Dispatch<React.SetStateAction<string[]>>;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

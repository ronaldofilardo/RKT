import type { HistoryEntry } from "@/core/scoring/types";

export interface PersistStateOptions {
  matchId: string;
  match: { version?: number | null } | null;
  tokenRef: { current: string | null };
  setError: (error: string | null) => void;
  fetchMatch?: (forceEngineReset?: boolean) => Promise<void>;
  allowScoreEdit?: boolean;
  /**
   * Histórico de pontos detalhado (rallyDetails, firstFaultDetail, etc).
   * Quando fornecido, o snapshot persistido envia `{ state, history }`
   * (formato aceito por `ScoringEngine.fromSerialized`), preservando os
   * dados necessários para o relatório. Quando ausente, mantém o
   * comportamento legado (somente `state`) — usado por fluxos que já
   * persistem history via POST /point.
   */
  history?: HistoryEntry[];
  /**
   * true apenas no fluxo "Editar Placar" (retomada de partida
   * interrompida). Instrui o backend a preservar o `scoreState` anterior
   * em `MatchScoreEdit` antes de sobrescrevê-lo, para a timeline do
   * /report não perder o trecho já anotado antes da correção.
   */
  isManualScoreEdit?: boolean;
  /**
   * ID do PointLog a ser anulado atomicamente junto com a atualização de estado.
   */
  voidPointLogId?: string;
  voidLastPoint?: boolean;
  isUndo?: boolean;
  note?: string;
  /**
   * Sincroniza o sacador inicial persistido junto com o scoreState.
   * Usado pela correção de sacador no game 1, quando a reidratação ainda
   * deriva `state.server` a partir do `initialServerId`.
   */
  initialServerId?: string;
}

export interface VersionConflictPayload {
  error?: string;
  currentVersion?: number;
}

export interface ErrorResponseBody {
  error?: string;
  message?: string;
}

export interface SuccessResponseBody {
  version?: number;
}

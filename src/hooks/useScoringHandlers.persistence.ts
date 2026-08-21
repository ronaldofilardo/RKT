import type { ScoringState, HistoryEntry } from "@/core/scoring/types";
import { logger } from "@/lib/logger";
import { TIMEOUTS, PERSIST } from "@/lib/constants";
import { getAllowScoreEdit, getPersistedScoreState, getRetryDelay } from "./useScoringHandlers.persistence.helpers";
import { handleVersionConflict } from "./useScoringHandlers.persistence.conflict";

interface PersistStateOptions {
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
}

interface ErrorResponseBody {
  error?: string;
  message?: string;
}

interface SuccessResponseBody {
  version?: number;
}


export async function persistStateWithRetry(
  state: ScoringState,
  label: string,
  options: PersistStateOptions,
): Promise<{ success: boolean; needsResync?: boolean; conflict?: boolean; version?: number }> {
  const { matchId, match, tokenRef, setError, fetchMatch, history, isManualScoreEdit } = options;

  if (!match) return { success: false };

  const allowScoreEdit = getAllowScoreEdit(label, options.allowScoreEdit);

  let currentMatch = match;
  const maxRetries = PERSIST.MAX_RETRIES;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(`/api/matches/${matchId}/state`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${tokenRef.current}`,
        },
        body: JSON.stringify({
          state: state.isFinished ? "FINISHED" : "IN_PROGRESS",
          // Persiste snapshot `{ state, history }` quando history estiver
          // disponível, preservando anotações detalhadas para o relatório.
          // Caso contrário, mantém o legado (somente `state`).
          scoreState: getPersistedScoreState(state, history),
          version: currentMatch.version,
          allowScoreEdit,
          isManualScoreEdit,
        }),
      });

      if (response.status === 409) {
        return handleVersionConflict(response, {
          label,
          currentVersion: currentMatch.version,
          fetchMatch,
          setError,
        });
      }

      if (!response.ok) {
        const errorBody = (await response.json().catch(() => null)) as
          | ErrorResponseBody
          | null;
        logger.persist.httpError(label, response.status, errorBody);
        throw new Error(
          `HTTP ${response.status}${errorBody?.error ? `: ${errorBody.error}` : ""}`,
        );
      }

      const successData = (await response.json().catch(() => ({}))) as SuccessResponseBody;
      return { success: true, version: successData.version };
    } catch (err) {
      logger.persist.attemptFailed(label, attempt, maxRetries, err);

      if (attempt === maxRetries) {
        logger.persist.maxRetriesExhausted(label);
        setError(`Erro ao sincronizar placar (${label})`);
      } else {
        const delay = getRetryDelay(attempt);
        logger.persist.retrying(label, delay);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  return { success: false };
}

export const _INTERNAL = { TIMEOUTS, PERSIST };

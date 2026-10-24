import type { ScoringState } from "@/core/scoring/types";
import { logger } from "@/lib/logger";
import { PERSIST, calculateBackoffDelay } from "@/lib/constants";
import type { PersistStateOptions, ErrorResponseBody, SuccessResponseBody } from "./persistence.types";
import { readConflict, handleVersionConflict } from "./persistence-conflict.logic";

export type PersistResult = { success: boolean; needsResync?: boolean; conflict?: boolean; version?: number };

export async function persistStateWithRetry(
  state: ScoringState,
  label: string,
  options: PersistStateOptions,
): Promise<PersistResult> {
  const { matchId, match, tokenRef, setError } = options;

  if (!match) return { success: false };

  const allowScoreEdit =
    options.allowScoreEdit ?? (label === "edit-score" || label === "undo");

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
          scoreState: options.history ? { state, history: options.history } : state,
          version: currentMatch.version,
          allowScoreEdit,
          isManualScoreEdit: options.isManualScoreEdit,
          note: options.note,
          voidPointLogId: options.voidPointLogId,
          voidLastPoint: options.voidLastPoint,
          isUndo: options.isUndo ?? (label === "undo" || label === "undo-retry"),
        }),
      });

      if (response.status === 409) {
        const errorData = await readConflict(response);
        return await handleVersionConflict(label, options, currentMatch, errorData);
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
        const delay = calculateBackoffDelay(attempt);
        logger.persist.retrying(label, delay);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  return { success: false };
}

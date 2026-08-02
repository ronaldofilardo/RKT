import type { ScoringState } from "@/core/scoring/types";
import { logger } from "@/lib/logger";
import { TIMEOUTS_MS, PERSIST_RETRY, calculateBackoffDelay } from "@/lib/constants";

interface PersistStateOptions {
  matchId: string;
  match: { version?: number | null } | null;
  tokenRef: { current: string | null };
  setError: (error: string | null) => void;
  fetchMatch?: (forceEngineReset?: boolean) => Promise<void>;
  allowScoreEdit?: boolean;
}

interface VersionConflictPayload {
  error?: string;
  currentVersion?: number;
}

interface ErrorResponseBody {
  error?: string;
  message?: string;
}

interface SuccessResponseBody {
  version?: number;
}

async function readConflict(response: Response): Promise<VersionConflictPayload> {
  try {
    return (await response.json()) as VersionConflictPayload;
  } catch {
    return {};
  }
}

export async function persistStateWithRetry(
  state: ScoringState,
  label: string,
  options: PersistStateOptions,
): Promise<{ success: boolean; needsResync?: boolean; conflict?: boolean; version?: number }> {
  const { matchId, match, tokenRef, setError, fetchMatch } = options;

  if (!match) return { success: false };

  const allowScoreEdit =
    options.allowScoreEdit ?? (label === "edit-score" || label === "undo");

  let currentMatch = match;
  const { MAX_ATTEMPTS: maxRetries } = PERSIST_RETRY;

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
          scoreState: state,
          version: currentMatch.version,
          allowScoreEdit,
        }),
      });

      if (response.status === 409) {
        const errorData = await readConflict(response);
        logger.persist.conflict(label, errorData.currentVersion, currentMatch.version);

        if (!fetchMatch) {
          setError("Conflito de versão: re-sincronize o placar manualmente");
          return { success: false, needsResync: true, conflict: true };
        }

        try {
          await fetchMatch(true);
        } catch (refetchErr) {
          logger.persist.refetchFailed(label, refetchErr);
          setError("Conflito de versão: re-sincronize o placar manualmente");
          return { success: false, needsResync: true, conflict: true };
        }

        setError(
          label === "undo"
            ? "Outro dispositivo atualizou o placar. Sincronizado com a versão mais recente."
            : "Conflito de versão resolvido: placar re-sincronizado.",
        );
        return { success: false, needsResync: true, conflict: true };
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

export const _INTERNAL = { TIMEOUTS_MS, PERSIST_RETRY };

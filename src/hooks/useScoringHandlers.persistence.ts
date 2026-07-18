import type { ScoringState } from "@/core/scoring/types";

interface PersistStateOptions {
  matchId: string;
  match: { version?: number | null } | null;
  tokenRef: { current: string | null };
  setError: (error: string | null) => void;
}

export async function persistStateWithRetry(
  state: ScoringState,
  label: string,
  options: PersistStateOptions
): Promise<{ success: boolean; needsResync?: boolean }> {
  const { matchId, match, tokenRef, setError } = options;

  if (!match) return { success: false };

  const maxRetries = 3;
  const baseDelay = 1000;

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
          version: match.version,
          allowScoreEdit: label === "edit-score",
        }),
      });

      if (response.status === 409) {
        const errorData = await response.json().catch(() => ({}));
        console.warn(
          `[persistState:${label}] Version conflict (attempt ${attempt}/${maxRetries}):`,
          errorData
        );

        if (attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt - 1);
          console.log(`[persistState:${label}] Retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        } else {
          console.warn(
            `[persistState:${label}] Max retries reached, signaling need for re-sync`
          );
          setError("Conflito persistente: re-sincronize o placar manualmente");
          return { success: false, needsResync: true };
        }
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return { success: true };
    } catch (err) {
      console.error(
        `[persistState:${label}] Attempt ${attempt}/${maxRetries} failed:`,
        err
      );

      if (attempt === maxRetries) {
        console.error(`[persistState:${label}] Max retries exhausted`);
        setError(`Erro ao sincronizar placar (${label})`);
      }
    }
  }

  return { success: false };
}
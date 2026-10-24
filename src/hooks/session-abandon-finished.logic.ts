import { logger } from "@/lib/logger";
import type { ScoringState } from "@/core/scoring/types";

/**
 * Ramo "partida finalizada": PATCH /state (FINISHED) + PATCH /session (COMPLETED).
 * Falha do PATCH da sessão não invalida o resultado (a partida já está FINISHED).
 */
export async function finalizeFinishedMatch(
  mid: string,
  sid: string,
  state: Readonly<ScoringState>,
  matchVersion?: number,
): Promise<boolean> {
  const stateResponse = await fetch(`/api/matches/${mid}/state`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",        },
    body: JSON.stringify({
      state: "FINISHED",
      scoreState: state,
      ...(matchVersion !== undefined ? { version: matchVersion } : {}),
    }),
  });

  if (stateResponse.status === 409) {
    logger.warn(
      "[abandonCurrentSession] Conflito de versão (409) ao finalizar — outro dispositivo já atualizou o placar. Match já FINISHED ou estado divergente; session não fechada.",
    );
    return false;
  }

  if (!stateResponse.ok) {
    throw new Error(`state PATCH failed: ${stateResponse.status}`);
  }

  try {
    const sessionResponse = await fetch(`/api/matches/${mid}/sessions/${sid}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",          },
      body: JSON.stringify({
        status: "COMPLETED",
        finalState: state,
      }),
    });
    if (!sessionResponse.ok) {
      logger.warn(
        `[abandonCurrentSession] session PATCH failed (${sessionResponse.status}); match already FINISHED — leaving session open`
      );
    }
  } catch (sessionErr) {
    logger.warn(
      "[abandonCurrentSession] session PATCH exception; match already FINISHED — leaving session open",
      sessionErr
    );
  }
  return true;
}

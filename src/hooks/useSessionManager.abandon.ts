"use client";
import { logger } from "@/lib/logger";
import type { AbandonContext, AbandonDeps } from "./useSessionManager.abandon.types";
import { finalizeFinishedMatch } from "./session-abandon-finished.logic";
import { abandonActiveSession } from "./session-abandon-pending.logic";

export type { AbandonContext, AbandonDeps } from "./useSessionManager.abandon.types";

/**
 * Encerra a sessão de anotação ativa.
 *
 * Duas ramificações:
 *  - Partida finalizada (isFinished): PATCH /state (FINISHED) + PATCH /session (COMPLETED).
 *  - Partida em andamento: POST .../abandon com keepalive. Em caso de falha de rede,
 *    enfileira na pending-abandon queue para retry posterior.
 *
 * Extraído de useSessionManager.ts (2026-09-09) para permitir testes unitários isolados.
 */
export async function abandonCurrentSession(
  ctx: AbandonContext,
  deps: AbandonDeps,
  snapshot?: string,
): Promise<boolean> {
  const { sessionId: sid, matchId: mid, engine, token, matchVersion } = ctx;
  if (!sid || !mid) return false;
  if (!engine) return false;

  try {
    const state = engine.getState();
    const stateSnapshot = snapshot ?? engine.serialize();
    if (state.isFinished) {
      return await finalizeFinishedMatch(mid, sid, state, matchVersion);
    }
    return await abandonActiveSession(mid, sid, stateSnapshot, token, deps);
  } catch (e) {
    logger.error("[abandonCurrentSession] Error:", e);
    return false;
  }
}
